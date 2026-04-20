# Guia de testes SuperFrete (sandbox)

Este guia cobre os fluxos:
- Cotacao de frete
- Informacoes dos pacotes
- Enviar frete (criar etiqueta)
- Finalizar pedido (checkout)
- Informacoes do pedido/etiqueta
- Link para impressao da etiqueta
- Cancelar pedido

## 1) Variaveis de ambiente obrigatorias

Backend (.env):
- SUPERFRETE_TOKEN
- SUPERFRETE_BASE_URL (ex.: https://sandbox.superfrete.com/api/v0)
- SUPERFRETE_USER_AGENT (ex.: Point55/1.0 (atendimento.sacpoint@gmail.com))

Remetente (obrigatorio para criar etiqueta):
- SUPERFRETE_REMETENTE_NOME
- SUPERFRETE_REMETENTE_ENDERECO
- SUPERFRETE_REMETENTE_NUMERO
- SUPERFRETE_REMETENTE_COMPLEMENTO
- SUPERFRETE_REMETENTE_BAIRRO
- SUPERFRETE_REMETENTE_CIDADE
- SUPERFRETE_REMETENTE_ESTADO
- SUPERFRETE_REMETENTE_CEP
- SUPERFRETE_REMETENTE_DOCUMENTO

Opcional:
- SUPERFRETE_SERVICES (ex.: 1,2,17)
- SUPERFRETE_DEFAULT_SERVICE (ex.: 1)
- SUPERFRETE_PESO_PADRAO, SUPERFRETE_ALTURA_PADRAO, SUPERFRETE_LARGURA_PADRAO, SUPERFRETE_COMPRIMENTO_PADRAO
- SUPERFRETE_PLATFORM (ex.: Point55)

Paths (se a SuperFrete mudar URLs, ajuste aqui):
- SUPERFRETE_CALC_PATH (default: /calculator)
- SUPERFRETE_PACKAGES_PATH (default: /packages)
- SUPERFRETE_CART_PATH (default: /cart)
- SUPERFRETE_CHECKOUT_PATH (default: /checkout)
- SUPERFRETE_TAG_INFO_PATH (default: /tag/{id})
- SUPERFRETE_TAG_PRINT_PATH (default: /tag/print)
- SUPERFRETE_CANCEL_PATH (default: /order/cancel)

## 2) Rodar migracao

Execute a migracao nova para adicionar campos no pedido:
- backend/migrations/006-add-superfrete-etiquetas.sql

## 3) Teste automatizado (script)

Script pronto:
- backend/test-superfrete-sandbox.js

Variaveis para o script:
- TEST_USER_EMAIL
- TEST_USER_PASSWORD
- SUPERFRETE_TEST_SERVICE

Execucao:
1) Inicie o backend
2) Rode o script de teste

O script cobre todo o fluxo, incluindo cancelamento.

## 4) Fluxo manual via API

1) Cotacao de frete
- POST /api/superfrete/calcular

2) Informacoes dos pacotes
- GET /api/superfrete/pacotes

3) Criar etiqueta
- POST /api/pedidos/:id/etiqueta

4) Finalizar etiqueta (checkout)
- POST /api/pedidos/:id/etiqueta/pagar

5) Informacoes da etiqueta
- GET /api/pedidos/:id/etiqueta

6) Link de impressao
- POST /api/pedidos/:id/etiqueta/print

7) Cancelar etiqueta
- POST /api/pedidos/:id/etiqueta/cancelar
