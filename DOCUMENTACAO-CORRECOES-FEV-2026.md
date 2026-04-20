# Documentação de Correções - Fevereiro/2026

Data: 16/02/2026
Projeto: Site de Vendas

## Resumo executivo

Foi concluído um pacote de correções funcionais envolvendo catálogo, checkout, promoções, badges, notificações e fluxo de pedidos, com foco em:
- estabilidade de regras de negócio,
- consistência de preços por forma de pagamento,
- controle real de estoque por tamanho,
- melhoria da experiência de seleção de cor e tamanho.

---

## Itens corrigidos

### 1) Erro ao vincular badges
- Ajuste de rotas do frontend para os endpoints reais de relacionamento produto-badge.
- Resultado: vínculo e desvínculo de badge funcionando.

Arquivos:
- `frontend/src/services/api.ts`

### 2) Erro de codificação UTF-8 no catálogo
- Criado sanitizador de texto para corrigir mojibake em nomes/categorias.
- Aplicado no card de produto.

Arquivos:
- `frontend/src/utils/textSanitizer.ts`
- `frontend/src/components/ProductCard/ProductCard.tsx`

### 3) Som em notificações recebidas
- Adicionado beep curto via Web Audio API ao receber `notification:new`.

Arquivos:
- `frontend/src/components/NotificationsBell/NotificationsBell.tsx`

### 4) Pedido não mudava para entregue após retirada com código
- Ajuste de status na confirmação de retirada para finalizar como `entregue`.

Arquivos:
- `backend/controllers/pedidoController.js`

### 5) Promoções não desvinculavam do produto
- Update de promoção agora envia lista vazia quando necessário (em vez de `undefined`).

Arquivos:
- `frontend/src/app/admin/promocoes/page.tsx`

### 6) Valor não trocava entre crédito/débito/boleto/PIX
- Checkout recalcula subtotal/total com base na forma de pagamento selecionada.
- Resumo de itens também usa preço correto por método.

Arquivos:
- `frontend/src/app/checkout/page.tsx`

### 7) Envio de quantidade de parcelas para Asaas
- Frontend envia `parcelas` quando pagamento é cartão.
- Backend envia `installmentCount` para Asaas quando aplicável.

Arquivos:
- `frontend/src/services/api.ts`
- `frontend/src/app/checkout/page.tsx`
- `backend/controllers/pedidoController.js`

### 8) Quantidade por tamanho (ex.: 39, 40, 41), baixa individual e vendidos por numeração
Implementação completa de estoque por tamanho com consistência ponta a ponta.

#### Banco de dados
- Novas colunas JSONB em `produtos`:
  - `estoque_tamanhos`
  - `vendidos_tamanhos`
- Índices GIN para consulta eficiente.

Arquivo:
- `backend/migrations/014-add-estoque-por-tamanho.sql`

#### Backend
- Serviço centralizado de inventário para movimentação por tamanho:
  - valida disponibilidade por tamanho,
  - baixa e estorno por tamanho,
  - sincroniza estoque total,
  - controla vendidos por tamanho.

Arquivo:
- `backend/services/inventoryService.js`

Integrações no fluxo:
- criação/edição de produto,
- validação de carrinho,
- baixa no pagamento,
- baixa no webhook,
- estorno no cancelamento,
- registro de venda na retirada paga no local.

Arquivos:
- `backend/controllers/produtoController.js`
- `backend/controllers/carrinhoController.js`
- `backend/controllers/pedidoController.js`
- `backend/controllers/webhookController.js`

#### Frontend (admin e vitrine)
- Admin de produto permite editar estoque por tamanho.
- Exibição de vendidos por tamanho no admin.
- Seletor de tamanho no produto mostra disponibilidade e vendidos.

Arquivos:
- `frontend/src/app/admin/produtos/[id]/page.tsx`
- `frontend/src/app/admin/produtos/[id]/produto-form.module.scss`
- `frontend/src/components/SizeSelector/SizeSelector.tsx`
- `frontend/src/components/SizeSelector/SizeSelector.module.scss`
- `frontend/src/types/index.ts`
- `frontend/src/app/produtos/[id]/page.tsx`

### 9) Bolinhas de cores com múltiplas cores/variações
- Normalização robusta de nome/código de cor (acento, hífen, underscore, espaços).
- Parsing de múltiplas cores em uma mesma entrada.
- UI de cor mais clara para seleção e leitura.

Arquivos:
- `frontend/src/utils/colorMapping.ts`
- `frontend/src/components/ColorSelector/ColorSelector.tsx`
- `frontend/src/components/ColorSelector/ColorSelector.module.scss`
- `frontend/src/components/ProductCard/ProductCard.tsx`

---

## Melhorias adicionais no checkout (UX de parcelas)

- Seletor de parcelamento movido para o bloco de resumo, ao lado do total.
- Exibição de cálculo em tempo real: `Xx de R$ Y sem juros`.
- Indicador textual da forma de pagamento selecionada no resumo.
- Regra de limite de parcelas para carrinho com múltiplos produtos:
  - usa média ponderada por quantidade dos `parcelas_maximas` dos itens,
  - aplica arredondamento para baixo (floor),
  - limita entre 1 e 12.
  - Exemplo: item A com 3x e item B com 1x resulta em limite 2x.
- No envio para Asaas, quando forma de pagamento é cartão, o backend envia `installmentCount` com a quantidade selecionada.

Arquivos:
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/app/checkout/checkout.module.scss`

---

## Fluxo funcional esperado (após correções)

1. Usuário escolhe forma de pagamento.
2. Subtotal e total atualizam conforme preço por método (PIX/cartão/boleto/local).
3. Se cartão, usuário seleciona parcelas no resumo e visualiza valor da parcela.
4. Se produto tem controle por tamanho, carrinho/pedido validam estoque por numeração.
5. Pagamento confirmado baixa estoque por tamanho e atualiza vendidos por tamanho.
6. Cancelamento estorna estoque por tamanho corretamente.
7. Retirada com código finaliza em `entregue`.

---

## Checklist de validação manual

### Checkout e pagamento
- [ ] Alternar PIX/Cartão/Boleto e confirmar mudança de subtotal/total.
- [ ] Em cartão, alterar parcelas e validar cálculo `Xx de R$ Y`.
- [ ] Validar regra de carrinho misto (ex.: produto 3x + produto 1x -> limite 2x).
- [ ] Confirmar no log do backend o campo `installmentCount` antes da criação da cobrança no Asaas.

### Produto com tamanhos
- [ ] Cadastrar tamanhos (39/40/41) no admin com estoques diferentes.
- [ ] No produto, tamanho sem estoque deve ficar indisponível.
- [ ] Comprar tamanho específico e verificar baixa apenas naquela numeração.
- [ ] Validar atualização de `vendidos_tamanhos`.

### Promoções e badges
- [ ] Vincular/desvincular badge em produto.
- [ ] Desvincular todos os produtos de uma promoção e salvar.

### Notificações
- [ ] Receber nova notificação e confirmar toque sonoro.

---

## Observações técnicas

- As mudanças preservam compatibilidade com produtos antigos sem `estoque_tamanhos`.
- Quando não há controle por tamanho, o sistema continua usando `estoque` global.
- Para controle por tamanho ativo, `estoque` total é sincronizado automaticamente pela soma de `estoque_tamanhos`.
