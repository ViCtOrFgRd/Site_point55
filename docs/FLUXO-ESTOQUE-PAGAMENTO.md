# 🔄 Fluxo de Estoque - Sistema Atualizado

**Data da atualização:** 12 de fevereiro de 2026

---

## 🎯 Mudança Principal

**ANTES:** Estoque era reduzido na **criação** do pedido
**AGORA:** Estoque só é reduzido na **confirmação** do pagamento

---

## 📊 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE CRIA PEDIDO                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Verificar Estoque?    │
            │  disponível >= pedido  │
            └────────┬───────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ❌ NÃO                     ✅ SIM
        │                         │
        ▼                         ▼
  [ERRO: Estoque        ┌─────────────────┐
   Insuficiente]        │ Criar Pedido    │
                        │ Status: PENDENTE│
                        │                 │
                        │ Estoque: 10 un  │ ← NÃO MUDA!
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Aguardando Pagamento  │
                    │  (PIX, Boleto, etc)    │
                    └────────┬───────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
         💰 PAGO                      ❌ CANCELADO
              │                             │
              ▼                             ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ WEBHOOK ASAAS    │          │ Cancelar Pedido  │
    │ PAYMENT_CONFIRMED│          │ Status: CANCELADO│
    └────────┬─────────┘          │                  │
             │                    │ Estoque: 10 un   │ ← NÃO MUDA!
             ▼                    │ (nunca reduziu)  │
    ┌──────────────────┐          └──────────────────┘
    │ REDUZIR ESTOQUE  │
    │ 10 - 3 = 7 un    │ ← AGORA SIM!
    └────────┬─────────┘
             │
             ▼
      ┌─────────────┐
      │ Estoque = 0?│
      └──────┬──────┘
             │
     ┌───────┴───────┐
     │               │
  ✅ SIM          ❌ NÃO
     │               │
     ▼               ▼
┌──────────┐    [Fim do Processo]
│ INATIVAR │
│ PRODUTO  │
│ ativo=false
└────┬─────┘
     │
     ▼
┌──────────────┐
│ NOTIFICAR    │
│ ADMINS       │
│ "Estoque 0!" │
└──────────────┘
```

---

## 🔁 Cancelamento de Pedido

```
┌─────────────────────────────────────────────┐
│         ADMIN OU CLIENTE CANCELA            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
          ┌────────────────┐
          │ Status Pedido? │
          └────────┬───────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   PENDENTE                 PAGO
        │                     │
        ▼                     ▼
┌───────────────┐    ┌─────────────────┐
│ NÃO RESTAURAR │    │ RESTAURAR       │
│ ESTOQUE       │    │ ESTOQUE         │
│               │    │ 7 + 3 = 10 un   │
│ (nunca foi    │    └────────┬────────┘
│  reduzido)    │             │
└───────────────┘             ▼
                    ┌──────────────────┐
                    │ Produto Inativo? │
                    │ Estoque era 0?   │
                    └────────┬─────────┘
                             │
                      ┌──────┴──────┐
                      │             │
                   ✅ SIM        ❌ NÃO
                      │             │
                      ▼             ▼
              ┌──────────┐     [Fim]
              │ REATIVAR │
              │ PRODUTO  │
              │ ativo=true
              └────┬─────┘
                   │
                   ▼
            ┌──────────────┐
            │ NOTIFICAR    │
            │ ADMINS       │
            │ "Reativado!" │
            └──────────────┘
```

---

## 📌 Pontos-Chave

### ✅ CORRETO (Novo Fluxo)
1. Criar pedido → **Verifica** estoque (não reduz)
2. Pagar pedido → **Reduz** estoque
3. Cancelar pendente → **Não** altera estoque
4. Cancelar pago → **Restaura** estoque

### ❌ ERRADO (Fluxo Antigo)
1. ~~Criar pedido → Reduzia estoque~~
2. ~~Cancelar pendente → Restaurava estoque~~ (erro!)

---

## 🎯 Benefícios

- ✅ **Estoque Real:** Reflete vendas confirmadas, não intenções
- ✅ **Sem Bloqueios:** Pedidos não pagos não bloqueiam produtos
- ✅ **Disponibilidade Correta:** Produtos disponíveis até pagamento
- ✅ **Gestão Automática:** Inativação e reativação automáticas
- ✅ **Notificações:** Admins informados em tempo real

---

## 🧪 Testar

```bash
cd backend
node test-fluxo-estoque-pagamento.js
```

**Resultado esperado:**
```
✅ Criar pedido NÃO reduz estoque
✅ Confirmar pagamento REDUZ estoque
✅ Estoque zerado INATIVA produto
✅ Cancelar pedido pago RESTAURA estoque
✅ Cancelar pedido pendente NÃO altera estoque
✅ Produto reativado quando estoque restaurado
```

---

## 📞 Arquivos Importantes

- **Criação de Pedido:** `backend/controllers/pedidoController.js` (linha ~265)
- **Confirmação Pagamento:** `backend/controllers/webhookController.js` (linha ~77)
- **Cancelamento:** `backend/controllers/pedidoController.js` (linha ~883)
- **Testes:** `backend/test-fluxo-estoque-pagamento.js`
- **Documentação:** `docs/RELATORIO-SISTEMA-ESTOQUE-ZERO.md`

---

**Sistema 100% funcional e testado! ✅**
