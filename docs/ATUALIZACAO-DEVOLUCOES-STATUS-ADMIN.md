# Atualizacao Devolucoes, Status e Admin

Data: 11-02-2026

## Objetivo
Documentar as correcoes e melhorias aplicadas no fluxo de devolucoes (backend + frontend), sincronizacao de status do pedido e ajustes de UX no admin.

## Backend
- Adicionado status "concluido" como status valido para administracao de devolucoes.
- Sincronizacao automatica do status do pedido:
  - Ao criar devolucao, pedido passa para "devolucao".
  - Ao atualizar devolucao:
    - "em_analise" ou "aprovado" -> pedido "devolucao".
    - "recusado" -> pedido "entregue".
    - "concluido" -> pedido "devolvido".
- Mantido bloqueio para pedido nao pertencente ao usuario.

## Frontend - Usuario
- Adicionados filtros de status completos em "Meus Pedidos":
  - pendente, pago, processando, enviado, devolucao, devolvido, entregue, cancelado.
- Status e cores continuam consistentes com a lista do pedido.

## Frontend - Admin (Devolucoes)
- Removido uso de prompt para decisao/instrucoes.
- Criados campos inline para "Resumo da decisao" e "Instrucoes para o cliente".
- Motivo/Justificativa movidos para painel expansivel.
- Painel abre automaticamente quando houver:
  - justificativa_recorrencia
  - observacoes
  - admin_instrucoes
- Corrigido layout para evitar sobreposicao de textos longos.

## Frontend - Admin (Pedidos)
- Padronizado rotulo de status para "Entregue".

## Documentacao
- Atualizado relatorio de etapa para marcar "Solicitar troca/devolucao" como implementado.

## Observacoes
- O fluxo de status do pedido agora acompanha as decisoes do admin em devolucoes.
- O painel expansivel reduz poluicao visual na tabela e evita quebra de layout.
