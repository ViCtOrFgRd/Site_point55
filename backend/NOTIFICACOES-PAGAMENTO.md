# 📬 Sistema de Notificações de Pagamento

## Overview

Quando um pagamento é confirmado no Asaas, o sistema envia notificações **em tempo real** via **3 canais**:

1. **WebSocket/Socket.io** - Notificação em tempo real no frontend
2. **Email ao Cliente** - Confirmação de pagamento com detalhes do pedido
3. **Email aos Admins** - Alerta para processar o envio do pedido

---

## 🔄 Fluxo Completo de Notificação

```
┌─────────────────────────────────────────────────────────────┐
│                     Asaas API                               │
│         (Pagamento Confirmado via PIX/Boleto)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │   POST /api/webhooks/asaas           │
        │   (Webhook do Asaas)                 │
        └──────────────────┬───────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  webhookController.js                │
        │  - Valida webhook                    │
        │  - Atualiza status do pedido         │
        │  - Dispara notificações              │
        └──────────────────┬───────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Socket.io│    │ Email    │    │ Email    │
    │(Cliente) │    │ Cliente  │    │ Admins   │
    └──────────┘    └──────────┘    └──────────┘
```

---

## 📨 Estrutura de Emails

### Email para o Cliente

**Assunto:** `💰 Pagamento Confirmado - Pedido #{ID}`

**Conteúdo:**
- ✅ Badge de "Pagamento Recebido"
- Detalhes do pedido (ID, valor total, data, status)
- Informação sobre próximos passos
- Link para visualizar o pedido completo
- Contato WhatsApp para suporte

**Template**: `enviarEmailConfirmacaoPagamento()` em `emailService.js`

---

### Email para Admins

**Assunto:** `💰 Novo Pagamento Confirmado - Pedido #{ID}`

**Conteúdo:**
- Detalhes completos do pagamento
- Informações do cliente (nome, email)
- Método de pagamento usado
- Data/hora da confirmação
- Link direto para o painel administrativo
- Alert com recomendação de processar envio

**Template**: `enviarEmailNotificacaoPagamentoAdmin()` em `emailService.js`

**Enviado para:** Todos os usuários com `is_admin = true` e `ativo = true`

---

## 🔧 Implementação Técnica

### 1. Webhook Recebe Confirmação

```javascript
// POST /api/webhooks/asaas
POST /api/webhooks/asaas
Headers:
  - X-Webhook-Token: {ASAAS_WEBHOOK_TOKEN}

Body:
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_xxx",
    "status": "RECEIVED",
    "value": 199.90
  }
}
```

### 2. Validação e Processamento

```javascript
// webhookController.js - asaasWebhook()

1. Valida autenticação (middleware validateAsaasWebhook)
2. Busca pedido associado ao payment_id
3. Atualiza status do pedido para "pago"
4. Dispara notificações (Socket.io)
5. Envia emails (cliente + admins)
```

### 3. Notificação via Socket.io

```javascript
// Notifica em tempo real no frontend
notifyUser(pedido.usuario_id, {
  tipoEvento: 'payment_confirmed',
  titulo: '✅ Pagamento Confirmado!',
  mensagem: 'Pagamento do pedido #123 confirmado! Valor: R$ 199.90',
  payload: { pedido_id, payment_id, value }
})

// Notifica todos os admins
notifyAdmins({
  tipoEvento: 'pagamento_confirmado',
  titulo: '💰 Pagamento Confirmado',
  mensagem: 'Pedido #123 - R$ 199.90 - Cliente: user@email.com'
})
```

### 4. Envio de Emails

```javascript
// Cliente
await enviarEmailConfirmacaoPagamento(usuario.email, {
  id: pedido.id,
  nome: usuario.nome,
  total: payment.value,
  forma_pagamento: pedido.forma_pagamento
})

// Admins
await enviarEmailNotificacaoPagamentoAdmin(administradores, {
  id: pedido.id,
  nome: usuario.nome,
  email: usuario.email,
  total: payment.value,
  forma_pagamento: pedido.forma_pagamento
})
```

---

## 📋 Bancos de Dados Envolvidos

### Tabela: `notificacoes`
```sql
- id (SERIAL PRIMARY KEY)
- recipient_type ('user' | 'admin' | 'all_users')
- recipient_id (INT, usuario_id)
- tipo_evento (VARCHAR) - 'payment_confirmed', 'pagamento_confirmado', etc
- titulo (VARCHAR)
- mensagem (TEXT)
- payload (JSONB) - Dados adicionais
- lida (BOOLEAN DEFAULT false)
- data_criacao (TIMESTAMP DEFAULT NOW())
```

### Tabela: `pedidos`
Campos relacionados:
- `id` - ID do pedido
- `usuario_id` - Referência ao usuário
- `asaas_payment_id` - ID do pagamento no Asaas
- `asaas_payment_status` - Status atual no Asaas
- `status` - Status local ('pendente', 'pago', 'cancelado')
- `valor_total` - Valor do pedido
- `forma_pagamento` - 'pix', 'boleto', 'cartao'

### Tabela: `usuarios`
Campos necessários:
- `id`
- `email`
- `nome`
- `is_admin` - Flag de administrador
- `ativo` - Indica se está ativo

---

## 🚀 Testes

### Testar Webhook Localmente

```bash
# Simula um pagamento confirmado
node backend/test-webhook-asaas.js
```

**Resultado esperado:**
- ✅ Banco de dados atualizado (status = 'pago')
- ✅ Socket.io notifica cliente em tempo real
- ✅ Email enviado para cliente
- ✅ Email enviado para todos os admins

### Verificar Notificações no Frontend

```javascript
// Em qualquer página conectada com Socket.io
socket.on('notification:new', (notification) => {
  console.log('Nova notificação:', notification);
  // Processar e exibir toast/badge
});
```

---

## ⚙️ Configuração Necessária

### Variáveis de Ambiente (.env)

```env
# Email
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-app (App Password do Gmail)

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Asaas
ASAAS_TOKEN=$aact_hmlg_...
ASAAS_WEBHOOK_TOKEN=seu_token_secreto_webhook
```

### Configuração do Asaas Dashboard

1. Ir para **Webhooks** nas configurações
2. Adicionar URL: `https://seu-dominio.com/api/webhooks/asaas`
3. Adicionar Header: `X-Webhook-Token: {ASAAS_WEBHOOK_TOKEN}`
4. Selecionar eventos:
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_REFUNDED`

---

## 🔐 Segurança

### Validação de Webhook

Todos os webhooks são validados no middleware `validateAsaasWebhook`:

```javascript
// Verifica X-Webhook-Token header
const providedToken = req.headers['x-webhook-token'];
if (providedToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
  return res.status(403).json({ error: 'Token inválido' });
}
```

### Proteção de Dados

- Tokens de webhook não são expostos em logs
- Emails contêm apenas informações necessárias
- Socket.io notifica apenas usuários autenticados

---

## 📊 Eventos Tratados

| Evento | Ação | Notifica Cliente? | Notifica Admin? |
|--------|------|------------------|-----------------|
| `PAYMENT_CONFIRMED` | Atualiza para "pago" | ✅ Email | ✅ Email + Socket |
| `PAYMENT_RECEIVED` | Atualiza para "pago" | ✅ Email | ✅ Email + Socket |
| `PAYMENT_OVERDUE` | Notifica vencimento | ✅ Aviso | ✅ Socket |
| `PAYMENT_REFUNDED` | Atualiza para "cancelado" | ✅ Aviso | ✅ Socket |
| `PAYMENT_UPDATED` | Atualiza dados | ❌ | ❌ |

---

## 🐛 Troubleshooting

### Email não enviado

**Problema:** Emails não estão sendo recebidos

**Soluções:**
1. Verificar `EMAIL_PASSWORD` no `.env` (deve ser App Password do Gmail, não senha comum)
2. Verificar se a conta Gmail tem "Menos segurança" habilitada (para contas antigas)
3. Testar manualmente: `node -e "require('./backend/services/emailService').enviarEmail('seu-email@gmail.com', 'Teste', '<h1>Teste</h1>')"`

### Notificação não chega em tempo real

**Problema:** Socket.io não notifica cliente

**Soluções:**
1. Verificar se `io` está inicializado em `socket.js`
2. Verificar se cliente está conectado no servidor (browser console)
3. Testar com test script: `node backend/test-webhook-asaas.js`

### Webhook não é recebido

**Problema:** Asaas não consegue acessar webhook

**Soluções:**
1. Em desenvolvimento: usar ngrok para expor localhost
   ```bash
   ngrok http 5000
   ```
2. Configurar webhook URL no Asaas com URL do ngrok
3. Usar `test-webhook-asaas.js` para simular localmente

---

## 📞 Suporte

Para dúvidas sobre notificações de pagamento:
- Documentação Asaas: https://docs.asaas.com
- Verificar logs: `backend/logs/` (se configurado)
- Testar endpoint: `curl -X POST http://localhost:5000/api/webhooks/asaas -H "X-Webhook-Token: token"`

