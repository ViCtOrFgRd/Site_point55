# 🧪 Guia de Testes - Sistema de Notificações de Pagamento

## 📋 Pré-requisitos

### 1. Variáveis de Ambiente Configuradas

Certifique-se de que seu `.env` tem:

```env
# Backend
API_BASE_URL=http://localhost:5000
ASAAS_WEBHOOK_TOKEN=seu-token-secreto-webhook
ASAAS_TOKEN=$aact_hmlg_...

# Email
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-app-password

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

### 2. Servidor Backend Rodando

```bash
cd backend
npm run dev
```

---

## 🧪 Testes Disponíveis

### Teste 1: Webhook + Notificações Completas

**Arquivo:** `test-webhook-pedido-real.js`

**O que faz:**
1. ✅ Faz login de um usuário existente
2. ✅ Cria um pedido novo com produtos reais
3. ✅ Gera um payment_id no Asaas
4. ✅ Simula webhook de confirmação de pagamento
5. ✅ Verifica atualização do pedido
6. ✅ Valida notificações e emails

**Como rodar:**

```bash
cd backend
node test-webhook-pedido-real.js
```

**Resultado esperado:**

```
✅ Login bem-sucedido
✅ Endereço obtido
✅ Produto obtido
✅ Pedido criado: #123
✅ Pagamento gerado no Asaas
✅ Webhook processado
✅ Pedido atualizado para "pago"
✅ Notificações criadas
✅ Emails enviados (cliente + admins)
```

---

### Teste 2: Sistema de Notificações (Simplificado)

**Arquivo:** `test-notificacoes-pagamento.js`

**O que faz:**
1. ✅ Faz login
2. ✅ Busca um pedido existente
3. ✅ Simula webhook de confirmação
4. ✅ Valida notificações criadas
5. ✅ Verifica atualização do pedido

**Como rodar:**

```bash
cd backend
node test-notificacoes-pagamento.js
```

---

### Teste 3: Webhook Asaas Direto

**Arquivo:** `test-webhook-asaas.js`

**O que faz:**
1. ✅ Simula evento PAYMENT_CONFIRMED do Asaas
2. ✅ Testa processamento do webhook
3. ✅ Valida resposta da API

**Como rodar:**

```bash
cd backend
node test-webhook-asaas.js
```

---

## 📊 Checklist de Validação

### ✅ Após Confirmação de Pagamento

Quando um pagamento é confirmado, verificar:

#### 1. **Banco de Dados**
```sql
-- Verificar se pedido foi atualizado
SELECT id, status, asaas_payment_status, data_atualizacao 
FROM pedidos 
WHERE id = 123 -- substituir por ID real

-- Resultado esperado: status = 'pago', asaas_payment_status = 'RECEIVED'
```

#### 2. **Notificações Sistema**
```sql
-- Verificar notificações criadas
SELECT * FROM notificacoes 
WHERE tipo_evento = 'payment_confirmed' 
ORDER BY data_criacao DESC 
LIMIT 5;

-- Resultado esperado:
-- - 1 notificação para o usuário (recipient_type = 'user')
-- - N notificações para admins (recipient_type = 'admin')
```

#### 3. **Emails Enviados**
- ✅ Email recebido pelo cliente com:
  - Assunto: "💰 Pagamento Confirmado - Pedido #123"
  - Corpo com detalhes do pedido
  - Link para acompanhar pedido
  - Contato de suporte

- ✅ Emails recebidos pelos admins com:
  - Assunto: "💰 Novo Pagamento Confirmado - Pedido #123"
  - Detalhes do cliente
  - Link para painel administrativo

#### 4. **Frontend em Tempo Real**
- ✅ Notificação aparece no topo da página
- ✅ Toast/Badge mostra "Pagamento Confirmado"
- ✅ Status do pedido muda para "pago"
- ✅ Página de sucesso exibe confirmação

---

## 🔄 Fluxo Completo de Teste

### Passo a Passo Manual

#### 1. **Criar Conta de Teste**
```bash
# No painel admin ou via script
# Email: test-pagamento@gmail.com
# Senha: test123456
```

#### 2. **Fazer Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-pagamento@gmail.com",
    "senha": "test123456"
  }'
```

#### 3. **Criar Pedido via Frontend**
- Acessar http://localhost:3000
- Adicionar produtos ao carrinho
- Ir para checkout
- Selecionar PIX como forma de pagamento
- Preencher endereço de entrega
- Confirmar pedido

**Resultado:** Receber payment_id do Asaas

#### 4. **Simular Webhook**
```bash
curl -X POST http://localhost:5000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: seu-token-webhook" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_xxx_do_pedido",
      "status": "RECEIVED",
      "value": 199.90
    }
  }'
```

#### 5. **Validar Resultado**
- ✅ Verificar email do cliente
- ✅ Verificar email dos admins
- ✅ Verificar status do pedido no frontend
- ✅ Verificar notificação em tempo real

---

## 🐛 Debug & Troubleshooting

### Problema: Emails não estão sendo enviados

#### 1. Verificar configuração de email

```javascript
// Testar envio de email direto
const emailService = require('./services/emailService');

emailService.enviarEmail(
  'seu-email@gmail.com',
  'Teste',
  '<h1>Teste</h1>'
).then(result => {
  console.log('✅ Email enviado:', result);
}).catch(err => {
  console.error('❌ Erro:', err);
});
```

#### 2. Verificar logs do transporter

```bash
# Adicionar no emailService.js
transporter.verify((error, success) => {
  if (error) {
    console.error('Email Config Error:', error);
  } else {
    console.log('✅ Email Server Connected');
  }
});
```

#### 3. Checker App Password do Gmail

- Ir para: https://myaccount.google.com/apppasswords
- Gerar nova App Password para "Mail"
- Usar essa senha no EMAIL_PASSWORD

### Problema: Webhook não processa

#### 1. Verificar token

```bash
# O token deve ser exatamente igual a ASAAS_WEBHOOK_TOKEN
echo $ASAAS_WEBHOOK_TOKEN
```

#### 2. Verificar logs

```bash
# No terminal do backend, procurar por:
# - "Webhook Asaas recebido"
# - "Pedido encontrado"
# - "Emails de confirmação..."
```

#### 3. Testar endpoint direto

```bash
curl -X POST http://localhost:5000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: seu-token" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "test_123",
      "status": "RECEIVED",
      "value": 100.00
    }
  }' \
  | jq .
```

### Problema: Notificações não aparecem no Frontend

#### 1. Verificar conexão Socket.io

```javascript
// No console do browser
console.log(socket?.connected); // deve ser true
```

#### 2. Verificar evento Socket.io

```javascript
// Adicionar listener no sucesso/page.tsx
socket.on('notification:new', (notif) => {
  console.log('🔔 Nova notificação:', notif);
});
```

#### 3. Testar com teste simples

```bash
# Em um terminal, simular webhook
node test-webhook-asaas.js

# Simultaneamente, verificar no browser se notificação aparece
```

---

## 📈 Métricas de Sucesso

### ✅ Teste Passou Se:

- [x] Webhook retorna `200 OK`
- [x] Pedido status muda para "pago"
- [x] Notificação Socket.io é enviada
- [x] Email para cliente é recebido
- [x] Emails para admins são recebidos
- [x] Frontend mostra confirmação em tempo real
- [x] Banco de dados atualizado corretamente

### ❌ Teste Falhou Se:

- [ ] Webhook retorna erro 401/403 (token inválido)
- [ ] Pedido continua com status "pendente"
- [ ] Nenhuma notificação é criada
- [ ] Emails não são recebidos
- [ ] Frontend não atualiza em tempo real

---

## 🔐 Considerações de Segurança

### Validações Implementadas:

✅ **Token de Webhook**
- Valida `X-Webhook-Token` em cada requisição
- Retorna 403 se token estiver inválido

✅ **Autenticação Socket.io**
- Apenas usuários autenticados recebem notificações
- Cada usuário recebe apenas suas notificações

✅ **Validação de Dados**
- Verifica presença de payment_id
- Valida estrutura do webhook
- Confirma existência do pedido no banco

✅ **Proteção de Dados**
- Senhas não são logadas
- Tokens não são expostos
- Dados sensíveis são mascarados em logs

---

## 📚 Referências

- [Documentação Completa](./NOTIFICACOES-PAGAMENTO.md)
- [Webhook Asaas](./WEBHOOK-ASAAS.md)
- [Melhorias de Pagamento](./MELHORIAS-PAGAMENTO.md)

---

## 💡 Próximos Passos

Após validar todos os testes:

1. **Configurar Webhook no Dashboard Asaas**
   - Ir para Configurações > Webhooks
   - Adicionar URL: `https://seu-dominio.com/api/webhooks/asaas`
   - Adicionar Header: `X-Webhook-Token: {token}`

2. **Testar em Produção**
   - Fazer compra real em produção
   - Validar que emails chegam corretamente
   - Monitorar logs para erros

3. **Opcional: Implementar WebSocket**
   - Adicionar notificações push
   - Implementar som de confirmação
   - Adicionar vibração em mobile

