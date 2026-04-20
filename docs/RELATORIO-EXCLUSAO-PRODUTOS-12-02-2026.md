# Relatorio - Exclusao e Duplicidade de Produtos (12-02-2026)

## Contexto
- O admin mostrava mensagem de exclusao, mas o produto continuava listado.
- Era possivel cadastrar o mesmo produto novamente sem bloqueio.
- A base local estava vazia e foi feita importacao via CSV para recuperar produtos.

## Mudancas aplicadas

### 1) Exclusao real no banco (hard delete)
Arquivo: backend/controllers/produtoController.js
- A rota DELETE /api/produtos/:id agora remove o registro da tabela produtos.
- Antes de excluir, o fluxo valida:
  - Se o produto existe.
  - Se existe vinculo com pedidos (itens_pedido). Se existir, retorna 409 e orienta a inativar.
- Remove dependencias diretas para evitar referencias pendentes:
  - favoritos
  - produtos_badges
  - produto_categorias
  - comentarios
  - avaliacoes
- O fluxo foi envelopado em transacao (BEGIN/COMMIT/ROLLBACK).

Respostas esperadas:
- 200: { success: true, message: "Produto excluido com sucesso" }
- 404: produto nao encontrado
- 409: produto vinculado a pedidos (nao permite excluir)

### 2) Bloqueio de duplicidade por nome
Arquivo: backend/controllers/produtoController.js
- Na criacao de produto (POST /api/produtos), foi adicionado check case-insensitive por nome.
- Se encontrar, retorna 409 com mensagem de duplicidade.

Resposta esperada:
- 409: { success: false, error: "Produto ja cadastrado com esse nome" }

### 3) Admin: filtro de produtos inativos
Arquivo: frontend/src/app/admin/produtos/page.tsx
- Por padrao, a lista exibe apenas ativos.
- Adicionado toggle "Mostrar inativos" para visualizar os desativados.
- Ao excluir, a lista atualiza imediatamente o estado local.

Arquivo: frontend/src/app/admin/produtos/produtos.module.scss
- Estilos adicionados para o toggle.

### 4) Importacao via CSV (recuperacao local)
Arquivo: backend/scripts/importar-produtos.js
- Ajustado import do pool (const { pool } = require('../config/database');)
- Importacao realizada a partir de Produtos/Cadastro de produtos.csv
- Produtos agrupados por nome base (varias cores/tamanhos viram 1 produto)

Observacao:
- O script ignora quantidades <= 0.
- Alguns nomes ficaram com encoding incorreto no CSV (ex.: BON?) e um nome vazio foi gerado por parsing.

## Impacto funcional
- O botao de excluir agora remove o produto do banco, exceto se ele estiver em pedidos.
- Cadastro duplicado por nome foi bloqueado.
- Admin consegue alternar entre ativos e inativos.

## Testes recomendados
1) Admin > Produtos > Excluir um produto sem pedidos.
   - Esperado: produto some da lista e nao retorna no refresh.
2) Tentar excluir produto vinculado a pedido.
   - Esperado: erro 409 e mensagem para inativar.
3) Criar produto com nome ja existente.
   - Esperado: erro 409 de duplicidade.
4) Toggle "Mostrar inativos".
   - Esperado: listar inativos quando ativado.

## Pendencias opcionais
- Ajustar importacao CSV para corrigir encoding e evitar nome vazio.
- Mostrar mensagem amigavel no frontend quando a API retornar 409 na exclusao.
