# 🔄 Fluxogramas - Sistema de Notificações de Pagamento

## 1️⃣ Fluxo Visual Completo

```
                                    🌐 CLIENTE FAZENDO COMPRA
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │  Checkout     │
                                    │  PIX Selected │
                                    └───────┬───────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │  Asaas API    │
                                    │  Gera Payment │
                                    │  ID & QR Code │
                                    └───────┬───────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │  Cliente      │
                                    │  Escaneia QR  │
                                    │  Paga PIX     │
                                    └───────┬───────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │  Banco        │
                                    │  Confirma $   │
                                    └───────┬───────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────┐
                        │  ⚡ Asaas Processa Confirmação ⚡  │
                        │  Status: PAYMENT_RECEIVED         │
                        └───────────┬───────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │  POST /api/webhooks/asaas     │
                    │  Event: PAYMENT_RECEIVED      │
                    │  Header: X-Webhook-Token: ... │
                    └───────────┬───────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  Validar Token         │
                    │  ✅ Válido?            │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  Buscar Pedido         │
                    │  WHERE asaas_payment.. │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  UPDATE pedidos        │
                    │  status = 'pago'       │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  Buscar Usuário        │
                    │  E ADMINS              │
                    └──────┬─────────────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        ┌────────┐    ┌────────┐    ┌────────┐
        │Socket  │    │Email   │    │Email   │
        │IO User │    │Client  │    │Admins  │
        │        │    │        │    │        │
        └────────┘    └────────┘    └────────┘
           │             │              │
           ▼             ▼              ▼
      Notif Real    📧 Caixa de    📧 Caixa de
      no Frontend   Entrada User   Entrada Admin
                       │              │
                       └──────┬───────┘
                              ▼
                    ✅ CLIENTE E ADMINS
                       NOTIFICADOS COM
                       SUCESSO! 🎉
```

---

## 2️⃣ Fluxo de Processamento do Webhook

```
                    📥 ENTRADA: Webhook Asaas
                            │
                            ▼
                ┌──────────────────────┐
                │ Middleware:          │
                │ validateAsaasWebhook │
                │ ├─ Verificar token   │
                │ └─ ✅ ou ❌          │
                └──────┬───────────────┘
                       │
                  ✅ Token OK?
                       │
    ┌──────────────────┴──────────────────┐
    │                                     │
   ❌ NÃO                                ✅ SIM
    │                                     │
    ▼                                     ▼
┌───────────┐                   ┌──────────────────┐
│ Return    │                   │ asaasWebhook()   │
│ 403       │                   │ Controller       │
│ Unauthorized                  └──────┬───────────┘
└───────────┘                          │
                                       ▼
                            ┌──────────────────┐
                            │ Extrair Dados:   │
                            │ - event          │
                            │ - payment.id     │
                            │ - payment.value  │
                            └──────┬───────────┘
                                   │
                                   ▼
                            ┌──────────────────┐
                            │ Buscar Pedido    │
                            │ WHERE asaas_     │
                            │ payment_id = ?   │
                            └──────┬───────────┘
                                   │
                                Encontrou?
                                   │
                    ┌──────────────┴──────────────┐
                    │                            │
                   NÃO                          SIM
                    │                            │
                    ▼                            ▼
            ┌──────────────┐         ┌──────────────────┐
            │ Log Warning  │         │ Verificar Tipo   │
            │ "Pedido não  │         │ de Evento        │
            │  encontrado" │         └──────┬───────────┘
            │ Return 200   │                │
            └──────────────┘                ▼
                                  ┌──────────────────┐
                                  │ 14 Casos Poss.   │
                                  │ -CREATED         │
                                  │ -UPDATED         │
                                  │ -CONFIRMED ⭐    │
                                  │ -RECEIVED ⭐     │
                                  │ -OVERDUE         │
                                  │ -REFUNDED        │
                                  │ ... (8 mais)     │
                                  └──────┬───────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
              Payment Confirmed?                     Outro tipo?
                    │                                         │
                    ▼                                         ▼
        ┌───────────────────┐                    ┌──────────────────┐
        │ novoStatus =      │                    │ Processar evento │
        │ 'pago'            │                    │ específico       │
        │                   │                    │ (OVERDUE,        │
        │ notificarUsuario= │                    │  REFUNDED, etc)  │
        │ true              │                    └──────┬───────────┘
        └─────────┬─────────┘                          │
                  │                                     │
                  ▼                                     ▼
        ┌──────────────────────┐         ┌──────────────────────┐
        │ UPDATE pedidos       │         │ UPDATE pedidos       │
        │ SET status = 'pago'  │         │ SET status = '....'  │
        └─────────┬────────────┘         └──────────┬───────────┘
                  │                                  │
                  ▼                                  ▼
        ┌──────────────────────┐         ┌──────────────────────┐
        │ Buscar Usuário       │         │ Salvar no BD         │
        │ + ADMINS             │         │ Notificações (se     │
        │                      │         │ aplicável)           │
        │ SELECT email, nome   │         └──────┬───────────────┘
        │ FROM usuarios        │                │
        │ WHERE id = ? OR      │                ▼
        │ is_admin = true      │         ┌─────────────┐
        └─────────┬────────────┘         │ Return 200  │
                  │                      │ Success! ✅ │
                  ▼                      └─────────────┘
        ┌──────────────────────┐
        │ Enviar Emails:       │
        │                      │
        │ 1. Cliente          │
        │    enviarEmail      │
        │    Confirmacao()    │
        │                      │
        │ 2. Admins (N)       │
        │    enviarEmail      │
        │    Notificacao()    │
        └─────────┬────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ notifyUser()         │
        │ emit Socket.io       │
        │ user:123             │
        │ notification:new ✅  │
        │                      │
        │ notifyAdmins()       │
        │ emit Socket.io       │
        │ admin                │
        │ notification:new ✅  │
        └─────────┬────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ PROCESSAR TUDO →    │
        │ OK?                  │
        └────────┬─────────────┘
                 │
                 ▼
        ┌──────────────────────┐
        │ Return 200 OK ✅     │
        │ success: true        │
        │ message: 'Webhook    │
        │ processado com       │
        │ sucesso'             │
        └──────────────────────┘
```

---

## 3️⃣ Fluxo de Envio de Emails

```
                        📧 INÍCIO DO FLUXO DE EMAIL
                                    │
                    ┌───────────────▼────────────────┐
                    │ Dados Necessários?             │
                    │ ├─ usuario.email               │
                    │ ├─ pedido.id                   │
                    │ ├─ pedido.total                │
                    │ └─ admins[]                    │
                    └───────────┬────────────────────┘
                                │
                       ✅ Todos disponíveis?
                                │
                    ┌───────────▼────────────────┐
                    │ Email 1: CLIENTE            │
                    │                            │
                    │ enviarEmailConfirmacao   │
                    │ Pagamento()              │
                    └─────────┬─────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Construir Template │
                    │ HTML:              │
                    │ - Header (verde)   │
                    │ - Badge ✅         │
                    │ - Detalhes Pedido  │
                    │ - Link Pedido      │
                    │ - Contato          │
                    │ - Footer           │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │ nodemailer.sendMail │
                    │ FROM: noreply@...   │
                    │ TO: cliente@...     │
                    │ SUBJECT: 💰 Pagto.. │
                    │ HTML: template      │
                    └────────┬────────────┘
                             │
                        Enviou?
                             │
                    ┌────────┴─────────┐
                    │                  │
                  ✅ SIM              ❌ NÃO
                    │                  │
                    ▼                  ▼
            ┌──────────────┐   ┌──────────────┐
            │ Log:         │   │ Log Error:   │
            │ "✅ Email    │   │ "❌ Erro ao  │
            │ de confirm.  │   │ enviar email"│
            │ enviado para │   │              │
            │ cliente"     │   │ throw error  │
            └──────┬───────┘   └──────────────┘
                   │
                   ▼
            ┌──────────────────────┐
            │ Email 2: ADMINS      │
            │                      │
            │ enviarEmailNotif     │
            │ Pagamento           │
            │ Admin()             │
            │                      │
            │ admins.map(admin =>  │
            │   transporter.       │
            │   sendMail(...)      │
            │ )                    │
            └────────┬─────────────┘
                     │
            ┌────────▼────────────────┐
            │ Promise.all             │
            │ Esperar todos os emails │
            │                         │
            │ Para cada admin:        │
            │ ├─ Construir template   │
            │ ├─ Enviar email         │
            │ └─ Log resultado        │
            └────────┬────────────────┘
                     │
              Todos enviados?
                     │
            ┌────────┴──────────────┐
            │                       │
          ✅ SIM                  ⚠️ ALGUNS FALHARAM
            │                       │
            ▼                       ▼
    ┌──────────────────┐   ┌────────────────────┐
    │ Log:             │   │ Log:               │
    │ "✅ Email de     │   │ "⚠️ Enviados:      │
    │ notif. enviado   │   │ 2/3 admins         │
    │ para N admins"   │   │                    │
    │                  │   │ Erro(s):           │
    │ Return:          │   │ - admin3 falhou    │
    │ success: true,   │   │                    │
    │ enviados: N      │   │ Continuar mesmo    │
    │ total: N         │   │ assim (não falha   │
    └─────────┬────────┘   │ webhook)"          │
              │            └─────────┬──────────┘
              │                      │
              └──────────┬───────────┘
                         │
                         ▼
                 ┌────────────────┐
                 │ Função Retorna │
                 │ { success: ... }│
                 │                │
                 │ Webhook Continua
                 │ (não falha)    │
                 └────────┬───────┘
                          │
                          ▼
                  ✅ EMAILS ENVIADOS!
```

---

## 4️⃣ Fluxo de Notificações Socket.io

```
                    🔌 FLUXO DE NOTIFICAÇÕES SOCKET.IO
                                 │
                    ┌────────────▼──────────────┐
                    │ Após UPDATE pedido        │
                    │ status = 'pago'           │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │ Verificar Socket.io init  │
                    │ io = getSocketIo()        │
                    │                          │
                    │ io.connected?             │
                    └────────────┬──────────────┘
                                 │
                        ✅ Socket Pronto?
                                 │
            ┌──────────────────────┴──────────────────────┐
            │                                            │
           ❌ NÃO                                      ✅ SIM
            │                                            │
            ▼                                            ▼
        ┌────────┐                    ┌─────────────────────────┐
        │ Return │                    │ Notificação 1: USER     │
        │(skip)  │                    │                         │
        └────────┘                    │ io.to(`user:${userId}`) │
                                      │   .emit('notification   │
                                      │    :new', {             │
                                      │     tipoEvento: '...',  │
                                      │     titulo: '...',      │
                                      │     mensagem: '...',    │
                                      │     payload: {...}      │
                                      │    })                   │
                                      └────────┬────────────────┘
                                               │
                                               ▼
                                      ┌──────────────────────┐
                                      │ Notificação 2: ADMIN │
                                      │                      │
                                      │ io.to('admin')       │
                                      │   .emit('notif...', {│
                                      │    ...               │
                                      │   })                 │
                                      └────────┬─────────────┘
                                               │
                                               ▼
                                      ┌──────────────────────┐
                                      │ Frontend Recebe      │
                                      │                      │
                                      │ socket.on(           │
                                      │  'notification:new'  │
                                      │  (notif) => {        │
                                      │   // Processar       │
                                      │   // Mostrar Toast   │
                                      │   // Atualizar UI    │
                                      │  }                   │
                                      │ )                    │
                                      └────────┬─────────────┘
                                               │
                                               ▼
                                      ┌──────────────────────┐
                                      │ Cliente Vê           │
                                      │ Notificação Real     │
                                      │ na Tela! ✅ 🔔       │
                                      └──────────────────────┘
```

---

## 5️⃣ Resumo: 3 Canais de Notificação

```
                    PAGAMENTO CONFIRMADO
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    CANAL 1           CANAL 2             CANAL 3
   SOCKET.IO          EMAIL CLIENTE       EMAIL ADMIN
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
   ⚡ TEMPO REAL    📧 CONFIRMAÇÃO      📧 ALERTA
   • No navegador   • Bandeja entrada   • Bandeja entrada
   • Instantâneo    • Histórico         • Histórico
   • Visual          • Completo          • Completo
        │                   │                   │
        │         Assunto:  │        Assunto:   │
        │    💰 Pagamento   │     💰 Novo Pag.  │
        │    Confirmado     │     Confirmado    │
        │                   │                   │
        │         Conteúdo: │       Conteúdo:   │
        │    • Badge ✅     │    • Detalhes     │
        │    • Detalhes     │    • Link Painel  │
        │    • Link Pedido  │    • Alert!       │
        │    • Contact      │    • Contact      │
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
                    ✅ CLIENTE E ADMIN
                    PLENAMENTE INFORMADOS
```

---

## 6️⃣ Sequência de Tempo

```
T+0s      Cliente paga PIX
           │
T+1s      Banco confirma
           │
T+2s      Asaas recebe confirmação
           │
T+2.5s    Asaas dispara webhook
           │
T+2.7s    POST /api/webhooks/asaas
           │
T+2.8s    ├─ Valida token
           ├─ Atualiza pedido
           ├─ Busca usuário/admins
           │
T+3.0s    ├─ Enviar emails
           │  ├─ nodemailer.sendMail() × 1 (cliente)
           │  └─ nodemailer.sendMail() × N (admins)
           │
T+3.5s    ├─ Socket.io broadcast
           │  ├─ io.to(`user:${id}`)
           │  └─ io.to('admin')
           │
T+4.0s    └─ Return 200 OK
           │
T+5s-10s  EMAIL CHEGA NA INBOX DO CLIENTE ✅
           │
T+5s-10s  EMAIL CHEGA NA INBOX DE ADMINS ✅
           │
T+0s-inf  NOTIFICAÇÃO PERSISTE NO BANCO ✅

RESULTADO: Tudo pronto em ~4s!
```

---

## 7️⃣ Árvore de Decisões

```
WEBHOOK RECEBIDO
        │
        ▼
   ┌─────────┐
   │ Token   │
   │ Válido? │
   └────┬────┘
        │
   ┌────┴─────┐
   │           │
  NÃO         SIM
   │           │
   ▼           ▼
 403       ┌────────┐
Err        │Pedido  │
           │Existe? │
           └────┬───┘
                │
           ┌────┴────┐
           │          │
          NÃO        SIM
           │          │
           ▼          ▼
         200       ┌──────┐
       (skip)      │Tipo  │
                   │Evento│
                   └──┬───┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
  CONFIRMED     RECEIVED      OUTROS
   |RECEIVED|              │
        │             │             │
        ▼             ▼             ▼
   novoStatus    novoStatus    Check
   ='pago'      ='pago'       específico
        │             │             │
        └─────┬───────┘             │
              ▼                     │
          Enviar                    │
         Emails?                    │
              │                     │
             SIM                   │
              │                    │
              ▼                    │
        Buscar Usuário             │
        + Admins                   │
              │                    │
              ▼                    │
        ┌───────────┐              │
        │ Envia     │              │
        │ Email     │              │
        │ Cliente   │              │
        └─────┬─────┘              │
              │                    │
              ▼                    │
        ┌───────────┐              │
        │ Envia     │              │
        │ Emails    │              │
        │ Admins    │              │
        └─────┬─────┘              │
              │                    │
              └────────┬───────────┘
                       │
                       ▼
                 Socket.io
                 Notif
                       │
                       ▼
                  Return 200
                  Success! ✅
```

---

## 📊 Diagrama de Entidades

```
┌────────────────┐           ┌─────────────────┐
│    usuarios    │           │    pedidos      │
├────────────────┤           ├─────────────────┤
│ id (PK)        │◄──────────│ usuario_id (FK) │
│ email          │ 1:N       │ id (PK)         │
│ nome           │           │ status          │
│ is_admin       │           │ asaas_payment_id│
│ ativo          │           │ valor_total     │
└────────────────┘           │ forma_pagamento │
         ▲                    └────────┬────────┘
         │                            │
         │                            │
         │ notifica    ┌──────────────▼──────────┐
         │             │  notificacoes           │
         └─────────────┤  ├─────────────────────┤
                       │  │ id (PK)             │
                       │  │ recipient_type      │
                       │  │ recipient_id (FK)   │
                       │  │ tipo_evento         │
                       │  │ titulo              │
                       │  │ mensagem            │
                       │  │ payload (JSONB)     │
                       │  │ data_criacao        │
                       │  │ lida                │
                       └──┴─────────────────────┘
```

---

**Esses fluxogramas ajudam a entender exatamente o que acontece em cada etapa do sistema! 📊**

