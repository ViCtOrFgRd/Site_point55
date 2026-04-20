# 🔔 Configuração do Webhook Asaas

## ✅ O que foi implementado

1. **Controller de Webhook** - `controllers/webhookController.js`
2. **Rotas de Webhook** - `routes/webhooks.js`
3. **Validação de Segurança** - Token de autenticação
4. **Processamento de Eventos** - Atualização automática de status de pedidos
5. **Script de Teste** - `test-webhook-asaas.js`

---

## 🔧 Configuração no Backend (.env)

Adicione ao arquivo [backend/.env](backend/.env):

```dotenv
# Webhook Asaas (token de segurança)
ASAAS_WEBHOOK_TOKEN=webhook_point55_secret_token_2026_change_in_production
```

⚠️ **Em produção**, mude para um token mais seguro!

---

## 🌐 Configuração no Painel Asaas

### Para Sandbox (Desenvolvimento)

1. **Expor servidor local com ngrok:**
   ```bash
   # Instalar ngrok: https://ngrok.com/download
   ngrok http 5000
   ```
   Você receberá uma URL tipo: `https://xxxx-xx-xxx-xxx-xxx.ngrok-free.app`

2. **Acessar painel Asaas Sandbox:**
   - URL: https://sandbox.asaas.com
   - Login com suas credenciais

3. **Configurar Webhook:**
   - Menu: **Configurações** → **Integrações** → **Webhooks**
   - Clique em **"Novo Webhook"**
   - Preencha:
     - **URL**: `https://sua-url-ngrok.ngrok-free.app/api/webhooks/asaas`
     - **Header de Autenticação** (opcional):
       - Nome: `X-Webhook-Token`
       - Valor: `webhook_point55_secret_token_2026_change_in_production`
   
4. **Selecionar Eventos:**
   Marque os eventos relacionados a **Payment**:
   - ✅ `PAYMENT_CREATED` - Pagamento criado
   - ✅ `PAYMENT_UPDATED` - Pagamento atualizado
   - ✅ `PAYMENT_CONFIRMED` - **Pagamento confirmado (IMPORTANTE)**
   - ✅ `PAYMENT_RECEIVED` - **Pagamento recebido (IMPORTANTE)**
   - ✅ `PAYMENT_OVERDUE` - Pagamento vencido
   - ✅ `PAYMENT_DELETED` - Pagamento deletado
   - ✅ `PAYMENT_REFUNDED` - Pagamento reembolsado

5. **Salvar**

### Para Produção

1. **URL do Webhook:**
   ```
   https://seudominio.com/api/webhooks/asaas
   ```

2. **Header de Autenticação:**
   - Nome: `X-Webhook-Token`
   - Valor: seu token seguro (diferente do desenvolvimento)

3. **Repetir os mesmos passos** acima, mas no painel de produção:
   - URL: https://www.asaas.com

---

## 🧪 Como Testar

### 1. Testar Endpoint (Verificar se está funcionando)

```bash
# Com curl
curl http://localhost:5000/api/webhooks/asaas/test

# Com navegador
http://localhost:5000/api/webhooks/asaas/test
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Webhook Asaas está configurado e funcionando",
  "url": "http://localhost:5000/api/webhooks/asaas",
  "token_configured": true,
  "environment": "development"
}
```

### 2. Testar com Script Automatizado

```bash
cd backend
node test-webhook-asaas.js
```

O script testará todos os eventos simulando notificações do Asaas.

### 3. Testar Manualmente (Simular Webhook)

```bash
curl -X POST http://localhost:5000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: webhook_point55_secret_token_2026_change_in_production" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_12345",
      "status": "CONFIRMED",
      "value": 150.00
    }
  }'
```

### 4. Testar com Pedido Real

1. **Criar um pedido no sistema** (via frontend ou API)
2. **Anotar o `asaas_payment_id`** do pedido
3. **Simular pagamento no painel Asaas Sandbox:**
   - Acesse: Cobranças → Buscar pelo ID
   - Clique em "Simular Recebimento"
4. **Verificar se o webhook foi chamado** (logs do backend)
5. **Verificar se o status do pedido mudou** para `pago`

---

## 📊 Eventos Processados

| Evento | Ação no Sistema | Novo Status |
|--------|----------------|-------------|
| `PAYMENT_CREATED` | Atualiza registro Asaas | `pendente` |
| `PAYMENT_UPDATED` | Atualiza registro Asaas | Mantém atual |
| `PAYMENT_CONFIRMED` | ✅ **Confirma pagamento** | `pago` |
| `PAYMENT_RECEIVED` | ✅ **Confirma pagamento** | `pago` |
| `PAYMENT_OVERDUE` | Notifica vencimento | Mantém atual |
| `PAYMENT_REFUNDED` | Reembolso processado | `cancelado` |

---

## 🔍 Logs e Debugging

O webhook gera logs detalhados no console:

```
📨 Webhook Asaas recebido: { event: 'PAYMENT_CONFIRMED', paymentId: 'pay_xxx', ... }
🔍 Pedido encontrado: #123, status atual: pendente
💰 PAGAMENTO CONFIRMADO!
✅ Pedido #123 atualizado - Status: pago, Asaas Status: CONFIRMED
```

### Verificar no Banco de Dados

```sql
-- Ver pedidos com pagamento Asaas
SELECT 
  id, 
  status, 
  asaas_payment_id, 
  asaas_payment_status,
  total,
  data_pedido,
  data_atualizacao
FROM pedidos 
WHERE asaas_payment_id IS NOT NULL
ORDER BY id DESC;
```

---

## 🔐 Segurança

### Validação Implementada

1. **Token de autenticação** via header `X-Webhook-Token`
2. **Verificação de dados** obrigatórios (event, payment.id)
3. **Logs detalhados** para auditoria
4. **Resposta 200** mesmo em erro (evita reenvios infinitos)

### Recomendações em Produção

- ✅ Use token complexo e único
- ✅ Configure HTTPS (SSL/TLS)
- ✅ Monitore logs de webhook
- ✅ Configure alertas para falhas
- ✅ Valide IP de origem (opcional)

---

## 📚 Referências

- [Documentação Webhooks Asaas](https://docs.asaas.com/reference/webhooks)
- [API Asaas - Pagamentos](https://docs.asaas.com/reference/cobrancas)
- [Ngrok - Expor localhost](https://ngrok.com/)

---

## 🐛 Troubleshooting

### Webhook não é chamado

1. Verifique se a URL está correta no painel Asaas
2. Se usando ngrok, verifique se ainda está rodando
3. Confira se os eventos estão marcados
4. Veja os logs no painel Asaas (Webhooks → Histórico)

### Erro 401/403

- Token não está configurado ou está incorreto
- Verifique `ASAAS_WEBHOOK_TOKEN` no .env
- Confirme header `X-Webhook-Token` no painel Asaas

### Pedido não atualiza

- Verifique se `asaas_payment_id` está salvo no pedido
- Veja logs do backend
- Execute query SQL para verificar dados

### Servidor não responde

```bash
# Verifique se está rodando
curl http://localhost:5000/health

# Reinicie o backend
cd backend
npm run dev
```
