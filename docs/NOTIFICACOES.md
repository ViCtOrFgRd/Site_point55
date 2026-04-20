# Sistema de Notificacoes

## Visao geral
Este documento descreve o sistema de notificacoes (admin e usuario), o fluxo de eventos, as rotas, o Socket.IO e o comportamento de leitura/exclusao.

## Regras principais
- A unica notificacao global e Promocoes.
- Notificacoes globais sao entregues a todos, mas cada usuario pode marcar como lida ou apagar apenas para si.
- Notificacoes diretas (user/admin) pertencem a um usuario especifico.

## Persistencia (PostgreSQL)
Tabelas criadas:
- notificacoes
- notificacoes_usuarios

Arquivo de migracao:
- backend/migrations/005-add-notificacoes.sql

Estrutura basica:
- notificacoes: guarda todas as notificacoes (inclui globais).
- notificacoes_usuarios: guarda estado por usuario das globais (lida/apagada).

## Tipos de notificacao
- pedido_novo (admin)
- pedido_status (usuario)
- pedido_rastreio (usuario)
- devolucao_nova (admin)
- devolucao_status (usuario)
- devolucao_recorre (admin)
- avaliacao_nova (admin)
- promocao_publicada (global)

## Eventos e gatilhos (backend)
- Pedido criado -> admin
  - backend/controllers/pedidoController.js
- Pedido status atualizado -> usuario
  - backend/controllers/pedidoController.js
- Pedido com rastreio -> usuario
  - backend/controllers/pedidoController.js
- Devolucao criada -> admin
  - backend/controllers/devolucaoController.js
- Status da devolucao atualizado -> usuario
  - backend/controllers/devolucaoController.js
- Recorrencia de devolucao -> admin
  - backend/controllers/devolucaoController.js
- Avaliacao criada -> admin
  - backend/controllers/avaliacaoController.js
- Promocao criada/ativada -> global
  - backend/controllers/promocaoController.js

## Servicos (backend)
- backend/services/notificationService.js
  - notifyUser
  - notifyAdmins
  - notifyAllUsersPromotion

- backend/services/socket.js
  - setSocketIo
  - getSocketIo

## Socket.IO (backend)
Servidor configurado em:
- backend/server.js

Salas:
- user:{id}
- admin
- users (todas as contas para promocoes)

Evento emitido:
- notification:new

Autenticacao:
- JWT via socket.handshake.auth.token (ou Authorization header)

## Rotas da API (backend)
Base: /api/notificacoes
- GET / : lista notificacoes
- GET /nao-lidas : contador de nao lidas
- POST /ler-todas : marca todas como lidas
- POST /:id/ler : marca uma como lida
- DELETE /:id : remove uma notificacao

## Comportamento de leitura/exclusao
- Notificacao direta (user/admin): leitura e exclusao alteram a tabela notificacoes.
- Notificacao global (promocoes): leitura e exclusao gravam em notificacoes_usuarios.

## Frontend
- Componente do sino: frontend/src/components/NotificationsBell
- Integracao Socket.IO: socket.io-client
- Servicos de API: frontend/src/services/api.ts (notificationService)

Fluxo no frontend:
- Ao logar: busca contador de nao lidas
- Ao abrir painel: lista notificacoes
- Em tempo real: recebe notification:new via socket
- Pode marcar lida ou excluir

## Dependencias
Backend:
- socket.io

Frontend:
- socket.io-client

## Observacoes importantes
- Promocoes sao a unica notificacao global.
- Cada usuario pode apagar apenas a sua visualizacao de promocoes.
- Evitar duplicidade de eventos em updates repetidos.
