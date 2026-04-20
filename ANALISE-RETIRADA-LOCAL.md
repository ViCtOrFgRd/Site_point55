# Analise - Codigo de confirmacao para retirada no local

## 📋 Resumo Executivo

**Status do Projeto**: Especificação técnica completa com 52 requisitos mapeados e consolidados

**Decisões Críticas Consolidadas:**
- ✅ Código: 2 prefixos (01=pagamento na retirada, 11=online) + 6 dígitos numéricos (total 8)
- ✅ Armazenamento: Hash SHA-256 no banco (segurança)
- ✅ Validade: Sem expiração, mas com prazo de retirada de 7 dias
- ✅ Cancelamento com confirmação do admin: Após 7 dias + notificação ao cliente + estoque restaurado
- ✅ Segurança: Máximo 3 tentativas, bloqueio 3 minutos, auditoria completa com logs
- ✅ Local: Único (Shopping Jequitibas) mas configurável pelo admin
- ✅ Horário: Segunda a sábado, 10h às 17h (configurável por dia da semana)
- ✅ Pagamento: Suporta 2 fluxos (online com código após confirmação de pagamento, ou na retirada com código imediato)

---

## Contexto atual (resumo rapido)
- Hoje nao existe persistencia nem API para identificar pedidos de retirada local.
- O checkout exibe "Retirar no local", mas nao envia esse dado no payload do pedido.
- Nao ha campos na tabela `pedidos` para codigo de retirada, confirmacao, ou auditoria.
- O admin so atualiza status generico, sem validacao de codigo.

## Objetivo
Definir regras e requisitos para gerar um codigo de confirmacao dos pedidos de retirada no local, permitir validacao no admin, e atualizar o status para "retirado".

## Perguntas (responder todas)

### A. Fluxo e regras de negocio
1. Quando o codigo deve ser gerado?
   - No momento da conclusão do pedido (ao finalizar checkout)
2. Qual status inicial para pedidos de retirada?
   - Pendente de pagamento (se pagamento online) ou Pronto para retirada (se pagamento na retirada)
3. Qual status final apos confirmacao de retirada?
   - Retirado (com registro obrigatório: nome do cliente ou terceiro que retirou)
4. O pedido pode ser retirado por terceiro (ex: parente/portador)?
   - Sim
5. Em caso de terceiro, sera exigido documento adicional ou nome autorizado?
   - Nao

### B. Pagamento
6. Havera "pagamento na retirada"?
   - Sim, mas o cliente pode escolher pagar online e retirar no local, ou pagar na retirada. O codigo de confirmacao deve ser gerado em ambos os casos e deve informar o metodo de pagamento escolhido (online ou na retirada).
7. Se sim, qual combinacao de status usar?
   - aguardando_pagamento_retirada -> retirado
8. O codigo deve ser gerado mesmo para pagamento na retirada?
   - Sim


### C. Codigo de confirmacao
9. Formato do codigo:
   - 2 prefixos informativos (01 para pagamento na retirada, 11 para pagamento online)
   - 6 dígitos numéricos aleatórios
   - Total: 8 dígitos numéricos (ex: 01123456 ou 11654321)
10. O codigo deve expirar?
    - Não (permanece válido enquanto o pedido não for retirado)
11. O codigo pode ser reutilizado?
    - Nao (uso unico)
12. Onde o cliente recebe o codigo?
    - Email e tela do pedido e nos pedidos do usuario. O codigo deve ser exibido no detalhe do pedido, e o cliente pode mostrar esse codigo no celular para o admin confirmar a retirada. O codigo nao precisa ser impresso, mas pode ser opcionalmente impresso em um recibo ou etiqueta se desejado. O importante é que o codigo esteja facilmente acessivel para o cliente no momento da retirada, seja no celular ou em um papel, para que o admin possa validar a retirada de forma rapida e segura
13. O codigo deve ser exibido no admin ou apenas inserido/manual?
    - O codigo quando for gerado deve aparece pro admin no detalhe do pedido, e o admin pode clicar em "Confirmar retirada" e inserir o codigo para validar. O sistema deve comparar o codigo inserido com o codigo armazenado no banco para aquele pedido, e se for valido, atualizar o status para "Retirado".  O admin deverá ter uma tela de retirada de pedidos, onde ele pode ver os pedidos que estão aguardando retirada, e clicar em cada pedido para ver o detalhe e confirmar a retirada inserindo o codigo. O sistema deve registrar quem confirmou a retirada, a data/hora, e permitir adicionar uma observacao interna se necessario.

### D. Admin / Operacao
14. Quem pode confirmar retirada?
    - Somente admin
15. A confirmacao exige login com 2 fatores?
    - Nao
16. Deseja registrar auditoria detalhada?
    - Sim - nome da pessoa que retirou, data/hora da retirada, e opcionalmente uma observacao interna para controle de operacao. Essa informacao deve ser armazenada no banco e exibida no detalhe do pedido para referencia futura. O sistema deve permitir que o admin veja um historico de retiradas, com filtros por data, cliente, e status, para facilitar a gestao das retiradas no local. O registro detalhado
17. O admin precisa ver historico de tentativas de validacao?
    - Sim

### E. Dados e infraestrutura
18. Onde armazenar o codigo?
    - Hash no banco (SHA-256 recomendado para segurança)
19. Deseja salvar local de retirada (nome/endereco/horario)?
    - Sim. Local: Shopping Jequitibas | Endereco: Av. Jequitibas, 1234 | Horario: Segunda a sábado, 10h às 20h
    - Esses dados devem ser exibidos para o cliente no checkout e no detalhe do pedido
    - Admin pode atualizar essas informações conforme necessário
    - Suporta múltiplos locais (configurável) e horários diferenciados por dia da semana
20. Migracao no banco: pode adicionar colunas em `pedidos`?
    - Sim

### F. UI/UX
21. O cliente deve ver "Retirada no local" no detalhe do pedido?
    - Sim , deve receber no email.
22. O admin precisa de botao dedicado "Confirmar retirada"?
    - Sim
23. Deseja exibir QR Code para leitura rapida no admin?
    - Nao, codigo de barras e codigo numerico de 8 digitos para leitura rapida e validacao manual.

### G. Edge cases
24. O que fazer se o cliente perder o codigo?
    - Validar por documento
25. O que fazer se expirar?
    - Não expirar
26. O pedido pode ser cancelado apos estar pronto para retirada?
    - Sim, mas o cliente precisa justificar o motivo do cancelamento, caso ele tenha pago online, e o admin vai entra em contato para reembols.
27. O cliente pode reagendar a retirada?
    - Não, tem data para retirada, mas o cliente poderá informar data e horario de possivel ida para retirada, e o admin pode entrar em contato para confirmar ou ajustar a data de retirada.

28. O cliente tem prazo para retirar o pedido?
    - Sim, o cliente tem um prazo de 7 dias para retirar o pedido, contados a partir da data de disponibilidade para retirada. Se o cliente não retirar o pedido dentro desse prazo, o pedido será cancelado automaticamente, e o cliente receberá uma notificação informando sobre o cancelamento. O sistema deve monitorar os pedidos que estão aguardando retirada, e enviar lembretes para os clientes que estão próximos do prazo de retirada, para incentivar a retirada dentro do prazo estabelecido.

29. Ser o pedido for cancelado o produto votará para estoque?
    - Sim, o sistema deve atualizar o estoque automaticamente quando um pedido de retirada for cancelado, para garantir que os produtos fiquem disponíveis para outros clientes. O cliente receberá uma notificação informando sobre o cancelamento e a atualização do estoque.

## Observacoes adicionais

### H. Integracao com email e notificacoes
30. Qual template de email deve ser enviado ao cliente quando o pedido estiver pronto para retirada?
    - Email automatico com: codigo de confirmacao, local de retirada, endereco, horario, prazo de 7 dias, e instrucoes
    
31. Deve enviar lembretes de retirada?
    - Sim, enviar lembretes no dia 3, dia 5 e dia 6 antes do vencimento de 7 dias
32. O admin deve receber notificacao quando um pedido estiver pronto para retirada?
    - Sim, notificacao interna no painel de admin listando novos pedidos aguardando retirada

### I. Relacionamento com pagamento online
33. Se o cliente escolher "Retirar no local" + "Pagamento online":
    - Resposta esperada: Criar pedido em status "pendente_pagamento_retirada" -> gerar codigo de confirmacao -> enviar email com instrucoes + codigo -> cliente paga online -> webhook atualiza para "pronto_para_retirada" -> cliente retira com codigo

34. Se o cliente escolher "Retirar no local" + "Pagamento na retirada":
    - Resposta esperada: Criar pedido em status "pronto_para_retirada" (ja que nao precisa aguardar pagamento) -> gerar codigo -> enviar email com codigo e aviso de pagamento na retirada -> admin recebe notificacao -> admin insere o codigo de retirada e o site informa que o cliente precisa pagar e clienta paga e cliente retira 

35. O codigo de confirmacao deve mudar ou ter versoes diferentes para "pagamento online" vs "pagamento na retirada"?
    - Sim. O código possui 2 prefixos informativos:
      * **01XXXXXX** = Pagamento na retirada (cliente pagará no local)
      * **11XXXXXX** = Pagamento online (cliente já pagou ou está pendente)
    - Onde XXXXXX são 6 dígitos aleatórios
    - Isso facilita a identificação rápida do método de pagamento no momento da retirada
    - Admin sabe imediatamente se precisa cobrar ou não

### J. Relacionamento com estoque
36. Se um pedido de retirada estiver pendente por mais de 7 dias, o estoque deve ser liberado imediatamente?
    - Sistema envia notificações automáticas ao admin informando pedidos que estão próximos do vencimento (D-2, D-1)
    - No dia 8, se não foi retirado: Sistema cancela automaticamente o pedido, libera o estoque e notifica cliente
    - Admin recebe alerta sobre cancelamentos automáticos para acompanhamento
    - Cliente pode solicitar extensão do prazo (fora do sistema, via suporte)

37. Se o admin cancelar um pedido de retirada manualmente, qual deve ser a observacao registrada?
    - Exemplo: "Cancelado pelo admin em [data] - Motivo: Prazo expirado" ou permite admin digitar o motivo?
    - Resposta esperada: Admin digita motivo, e o sistema registra: data/hora, admin que cancelou, motivo, e notifica cliente automaticamente

### K. Interface admin - Tela de retiradas
38. Na tela de "Confirmar retirada", quais informacoes obrigatorias devem ser coletadas?
    - Nome de quem retirou (cliente ou terceiro)
    - E-mail de confirmacao (opcional)
    - Telefone de confirmacao (opcional)
    - Observacao interna (opcional)
    - Assinatura eletronico ou fotografia do recibo (opcional)
    - Resposta esperada: Nome obrigatorio, email/telefone opcional, observacao opcional para notas da operacao, forma de pagamento (online ou na retirada).

39. Deve haver um campo "quem retirou" preenchido automaticamente com dados do cliente, ou sempre deixar em branco para o admin digitar?
    - Resposta esperada: Preencher com nome do cliente como sugestao, mas permitir admin editar (para casos de terceiros)

40. Deve exibir informacoes do pedido (itens, valor total, forma de pagamento) na tela de confirmacao de retirada?
    - Resposta esperada: Sim, exibir resumo completo do pedido para o admin validar

### L. Seguranca e validacoes
41. O codigo de 8 digitos deve ter alguma regra de checksum ou validacao?
    - Resposta esperada: Sim, implementar algoritmo de checksum (ex: modulo 11) para evitar digitos aleatorios invalidos

42. Deve ter limite de tentativas erradas ao digitar o codigo?
    - Sim. Máximo 3 tentativas erradas
    - Após 3 falhas: bloqueia por 15 minutos, notifica admin + cliente
    - Admin pode desbloquear manualmente se necessário

43. Deve logar todas as tentativas de validacao (sucesso e falha) para auditoria?
    - Sim. Cada tentativa é registrada na tabela `retirada_auditoria`:
      * Timestamp da tentativa
      * Código inserido (armazenado mascarado por segurança: ex: **34****78)
      * Resultado (sucesso/falha)
      * IP do admin
      * Admin responsável
    - Cliente recebe notificação por email se houver:
      * 2 tentativas erradas (alerta de segurança)
      * 3 tentativas (bloqueio confirmado/sugestão de contato)
    - Admin pode visualizar historico completo no detalhe do pedido

### M. Relatorio gerencial
44. Deve ter relatorio de retiradas?
    - Sim, exibir: total de pedidos aguardando retirada, pedidos que venceram, taxa de retirada por periodo, cliente com mais tentativas erradas
    
45. Filtros do relatorio de retiradas:
    - Por data (de/ate)
    - Por cliente
    - Por status (pronto, em atraso, retirado, cancelado)
    - Por forma de pagamento
    - Por local de retirada
    - Resposta esperada: Todos os filtros listados

46. Deve exportar relatorio em CSV ou PDF?
    - Resposta esperada: Sim, ambos os formatos

### N. Integracao com API/Mobile (futuro)
47. Se houver app mobile do cliente, ele deve conseguir ver o codigo de retirada?
    - Sim. O código deve ser visível com as mesmas funcionalidades:
      * Copiar código
      * Compartilhar via WhatsApp/Email
      * Ver barcode para leitura rápida
      * Ver informações do local e prazo

48. O admin deve conseguir confirmar retirada via app mobile ou somente via web?
    - Por enquanto: Somente via web (para manter segurança)
    - Mobile admin: Apenas leitura de informações (consultas)
    - Confirmação de retirada: Exclusiva para web

### O. Dados adicionais de retirada (config loja)
49. Quem gerencia os dados de local/endereco/horario de retirada?
    - Admin
    - Gestor de configuracoes especifico
    - Resposta esperada: Admin 

50. Deve permitir multiplos locais de retirada?
    - Resposta esperada: Dever ser configuravel pelo admin, podendo ser multiplo local

51. Deve permitir horarios diferenciados por dia da semana?
    - Sim. Segunda a sábado: 10h às 20h (horário padrão)
    - Admin pode customizar por dia da semana conforme necessário
    - Domingo e feriados: A definir (configurável)

52. Deve exibir horario de funcionamento para o cliente no checkout?
    - Resposta esperada: Sim, exibir horario e dias de funcionamento quando cliente seleciona "Retirar no local"

### P. Prototipacao - Fluxo visual esperado
```
1. Checkout 
   - Seleciona "Retirar no local" em entrega
   - Exibe informacoes: Local, Endereco, Horario funcionamento
   - Seleciona forma pagamento (online ou na retirada)
   
2. Finalizacao
   - Pedido criado com status "pendente_pagamento_retirada" (se online) ou "pronto_para_retirada" (se na retirada)
   - Codigo de 8 digitos gerado (ex: 12345678)
   - Email enviado com codigo + instrucoes
   
3. Minha Conta > Pedidos > [Pedido de retirada]
   - area que Exibe todos os pedidos de retirada (destacado), Local, Horario, Prazo , Status
   
4. No local (apresentar codigo no celular ou papel)
   - Cliente mostra codigo para o admin   
   - Botão de confirmar retirada (abre modal)  
   - admin insere codigo de confirmacao e nome de quem retirou - confirma a retirada
    - Botao "Enviar recibo por email"

``` 

**Admin (Frontend)**
```
1. Dashboard > Pedidos > Aba "Retiradas pendentes"
   - Lista: ID pedido, Cliente, Data pedido, Status, Prazo, Acao
   - Filtro por data, status, cliente
   
2. Clicar em pedido > Detalhe
   - Resumo do pedido (itens, valor, pagamento)
   - Seção "Confirmar Retirada"
   - Campo: "Codigo de confirmacao" (input numerico)
   - Campo: "Nome de quem retirou" (pre-preenchido com cliente)
   - Campo: "Observacao interna" (textarea opcional)
   - Botao: "Confirmar retirada"
   
3. Apos clicar "Confirmar retirada"
   - Validar codigo com checksum
   - Se correto: atualizar status para "retirado", registrar auditoria, exibir mensagem sucesso
   - Se incorreto: exibir erro, contar tentativa, se 3 tentativas bloquear por 15 min
   
4. Relatorio > Retiradas
   - Graficos: % de retirada, media de dias para retirada
   - Tabela: Pedidos retirados (com data/hora/admin), pedidos em atraso, pedidos cancelados
```

## R. Consolidacao de decisoes criticas

### Formato do Codigo
```
[PREFIXO][RANDOM]
01XXXXXX = Pagamento na retirada (cliente paga no local)
11XXXXXX = Pagamento online (cliente já pagou ou pendente)

Total: 8 dígitos numéricos
Exemplo: 01123456 ou 11654321
Armazenamento: Hash SHA-256 no banco
Reutilização: Não (uso único por pedido)
```

### Statuses do Pedido (fluxo completo)
```
PAGAMENTO NA RETIRADA:
  novo → pronto_para_retirada → retirado → finalizado

PAGAMENTO ONLINE:
  novo → pendente_pagamento_retirada → pronto_para_retirada → retirado → finalizado

CANCELAMENTOS:
  pendente_pagamento_retirada → cancelado (se não pagar em tempo)
  pronto_para_retirada → cancelado (prazo expirado ou cancelamento manual)
```

### Prazos Críticos
```
T+0: Código gerado e email enviado ao cliente
T+3 dias: Primeiro lembrete (D-4 até vencimento)
T+5 dias: Segundo lembrete (D-2 até vencimento)
T+6 dias: Terceiro lembrete (D-1 até vencimento)
T+7 dias: Cancelamento automático
  → Sistema cancela pedido
  → Estoque é restaurado automaticamente
  → Cliente é notificado por email
  → Admin recebe alerta
```

### Segurança e Auditoria
```
✓ Código armazenado em hash SHA-256 (não em plaintext)
✓ Máximo 3 tentativas de validação
✓ Bloqueio de 15 minutos após 3 falhas
✓ Todas as tentativas registradas na tabela retirada_auditoria
✓ Cliente notificado de tentativas suspeitas (2 e 3 falhas)
✓ Logs registram: timestamp, código mascarado (01****56), resultado, IP, admin
✓ Histórico completo visível para auditoria no detalhe do pedido
```

### Dados do Local de Retirada
```
Local Principal:
  Nome: Shopping Jequitibas
  Endereço: Av. Jequitibas, 1234
  Horário: Segunda a sábado, 10h às 20h
  Configurável: Sim (admin gerencia no painel)
  
Múltiplos Locais: Estrutura pronta (tabela retirada_config suporta)
Horários Diferenciados: Sim (por dia da semana)
Domingo/Feriados: A definir (configurável)
Exibido para Cliente: Sim (checkout + detalhe pedido)
Exibido para Admin: Sim (detalhe pedido + painel)
```

### Notificacoes (Email) - Sequencia
```
Evento: Código gerado
  → Email com: código, local, endereço, horário, prazo 7 dias, instruções

Evento: D-2 (2 dias antes do vencimento)
  → Lembrete: "Faltam 2 dias para retirar seu pedido"

Evento: D-1 (1 dia antes do vencimento)
  → Alerta: "ÚLTIMA CHANCE: Retire seu pedido amanhã!"

Evento: Cancelamento automático (D+7)
  → Notificação: "Seu pedido foi cancelado por falta de retirada"
  → Motivo: Prazo expirado
  → Ação: Estoque foi restaurado
  
Evento: Tentativas de validação suspeitas
  → Alerta após 2 falhas
  → Alerta crítico após 3 falhas + bloqueio
  → Suggestion: Entre em contato com suporte
```

### Q. Campos no banco de dados (migracao)

**Tabela `pedidos` - novos campos:**
```sql
- entrega_tipo VARCHAR(20) -- 'entrega' | 'retirada_local'
- retirada_codigo_hash VARCHAR(255) -- hash SHA256 do codigo
- retirada_codigo_gerado_em TIMESTAMP
- retirada_confirmada_em TIMESTAMP
- retirada_confirmada_por INTEGER REFERENCES usuarios(id)
- retirada_confirmado_por_nome VARCHAR(255) -- nome de quem retirou
- retirada_observacao TEXT
- pagamento_na_retirada BOOLEAN DEFAULT FALSE
- retirada_prazo_vencimento DATE -- data de vencimento (7 dias)
- retirada_cancelado_automatico BOOLEAN DEFAULT FALSE -- se foi cancelado por timeout
```

**Nova tabela `retirada_auditoria`:**
```sql
CREATE TABLE retirada_auditoria (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id),
  admin_id INTEGER REFERENCES usuarios(id),
  tipo_evento VARCHAR(50), -- 'codigo_gerado', 'tentativa_validacao', 'validacao_sucesso', 'validacao_falha', 'cancelamento'
  descricao TEXT,
  ip_admin VARCHAR(45),
  data_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Nova tabela `retirada_config` (para gerenciar local/horario):**
```sql
CREATE TABLE retirada_config (
  id SERIAL PRIMARY KEY,
  nome_local VARCHAR(255), -- 'Shopping Jequitibas'
  endereco VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(9),
  horario_segunda_sabado VARCHAR(20), -- '10:00-20:00'
  horario_domingo VARCHAR(20), -- null ou a definir
  horario_feriados VARCHAR(20), -- a definir
  prazo_dias_retirada INTEGER DEFAULT 7,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Informacoes complementares

### Fluxo de pagamento na retirada (detalhe)
1. Cliente escolhe "Retirar no local" + "Pagamento na retirada"
2. Sistema cria pedido com `pagamento_na_retirada = true`
3. Status inicial: `pronto_para_retirada` (nao aguarda CONFIRMACAO de pagamento online)
4. Codigo gerado e email enviado
5. Admin ve no painel e quando cliente chega:
   - Valida codigo
   - Coleta dados de quem retirou
   - Marca como `retirado`
   - Cliente faz o pagamento no local (dinheiro, cartao, etc)
6. Admin registra pagamento em sistema separado ou marca como "pago na retirada"

### Fluxo de pagamento online + retirada local
1. Cliente escolhe "Retirar no local" + "Pagamento online"
2. Sistema cria pedido com `pagamento_na_retirada = false`
3. Status inicial: `pendente_pagamento_retirada` (aguarda confirmacao de pagamento)
4. Codigo gerado mas nao validado ainda (so sera validavel apos pagamento)
5. Email enviado com codigo e instrucoes para pagar
6. Cliente paga (PIX, boleto, cartao)
7. Webhook atualiza status para `pronto_para_retirada`
8. Resto do fluxo igual a pagamento na retirada

### Cancelamento automatico por prazo
- Sistema deve ter cron/job que roda diariamente
- Verifica pedidos com `entrega_tipo = 'retirada_local'` E `status = 'pronto_para_retirada'` E data > `retirada_prazo_vencimento`
- Cancela pedido, libera estoque, registra auditoria, envia email ao cliente
- Email deve conter: motivo (prazo expirado), opcao de remarcar, e se tiver pagado online ja pedir reembolso

### Lembretes de retirada
- Sistema deve enviar emails nos dias 3, 5, 6 antes do vencimento
- Email contem: codigo de retirada, local, horario, prazo restante
- Pode ser enviado via email + SMS (se houver sistema de SMS)

### Recuperacao de codigo perdido
- Cliente acessa "Minha conta > Pedidos > [Pedido retirada]"
- Sistema exibe codigo completo (ja que cliente tem direito de ver)
- Se cliente nao estiver logado quando chegar na loja:
  - Admin pode buscar pedido por: email + CPF ou telefone + data
  - Admin exibe codigo e deixa cliente validar

---

## S. Roadmap de Implementacao (Sequencia Recomendada)

### Fase 1: Database & Backend Foundation (Tempo: 3-4 dias)
**Prioridade**: CRÍTICA

**Tarefas**:
1. Criar migrations para alterações em `pedidos` (11 novos campos)
2. Criar tabelas novas: `retirada_auditoria`, `retirada_config`
3. Implementar funções helper:
   - Gerador de código com prefixo (01/11)
   - Hash SHA-256 para armazenamento
   - Validação de checksum do código
4. Criar modelo `RetiradaConfig` para CRUD do local

**Verificação**: Testes de criação de código, hash, validação

---

### Fase 2: Core Backend APIs (Tempo: 4-5 dias)
**Prioridade**: CRÍTICA

**Tarefas**:
1. Alterar `POST /api/pedidos` (criar pedido)
   - Aceitar `entrega_tipo` e `data_disponibilidade_retirada`
   - Gerar código se `entrega_tipo = retirada_local`
   - Enviar email com código
   
2. Criar `POST /api/pedidos/:id/confirmar-retirada`
   - Validar código vs hash
   - Registrar tentativas (com limite de 3)
   - Implementar bloqueio de 15 minutos após 3 falhas
   - Atualizar status para `retirado`
   - Registrar auditoria
   
3. Criar `GET /api/admin/retiradas` (listar com filtros)
   - Filtros: status, data, cliente, pagamento
   - Retorna pedidos aguardando retirada
   
4. Criar `GET /api/admin/retiradas/:id/historico`
   - Retorna histórico de tentativas para auditoria
   
5. Criar CRUD para endpoints de config do local
   - `GET /api/admin/retirada-config`
   - `PATCH /api/admin/retirada-config/:id`

**Verificação**: Testes de API com Postman/Thunder Client

---

### Fase 3: Scheduled Jobs & Email (Tempo: 2-3 dias)
**Prioridade**: ALTA

**Tarefas**:
1. Implementar scheduled job (cron) para:
   - D+3: Enviar primeiro lembrete
   - D+5: Enviar segundo lembrete
   - D+6: Enviar terceiro lembrete
   - D+7: Cancelamento automático + restauração estoque + email notificação
   
2. Criar templates de email:
   - Email inicial (código + local)
   - Lembrete D-4
   - Lembrete D-2
   - Lembrete D-1
   - Cancelamento automático
   - Alerta de tentativas suspeitas
   
3. Integrar com serviço de email existente (confirmar se Nodemailer/SendGrid)

**Verificação**: Testar jobs manualmente alterando datas

---

### Fase 4: Frontend Cliente (Tempo: 3-4 dias)
**Prioridade**: ALTA

**Tarefas**:
1. Alterar página de checkout
   - Exibir local, endereço, horário quando "Retirar no local" selecionado
   - Incluir campo "Data de retirada" (sugerida)
   - Detalhar método de pagamento escolhido
   
2. Alterar página "Minha Conta > Pedidos"
   - Destacar pedidos de retirada
   - Exibir tipo de entrega (Entrega / Retirada Local)
   
3. Criar/alterar página "Detalhe do Pedido"
   - Se retirada: exibir código (grande, destacado)
   - Botão "Copiar código"
   - Botão "Imprimir código/recibo"
   - Exibir local, endereço, horário, prazo
   - Exibir status e últimas atualizações
   - Campo para informar "data/horário previsto de ida" (opcional)

**Verificação**: Testar fluxo completo no checkout

---

### Fase 5: Frontend Admin (Tempo: 3-4 dias)
**Prioridade**: ALTA

**Tarefas**:
1. Criar aba "Retiradas" em admin/pedidos
   - Listar pedidos com status `pronto_para_retirada`
   - Filtros: data, cliente, status, pagamento
   - Ações: Clicar para detalhe
   
2. Componente "Confirmar Retirada"
   - Campo: Código (input numérico)
   - Campo: Nome de quem retirou (pre-preenchido, editável)
   - Campo: Observação interna (opcional)
   - Validação real-time do código
   - Exibir erros/tentativas
   
3. Página de Histórico/Auditoria
   - Mostrar todas as tentativas (sucesso/falha)
   - Filtrar por data, admin, resultado
   
4. Painel de Relatório
   - Gráficos: % de retirada, média de dias
   - Tabela: Pedidos retirados (data/hora/admin)
   - Botão de exportar (CSV/PDF)
   
5. Página de Configurações (Local/Horário)
   - CRUD para dados do local
   - Horários por dia da semana

**Verificação**: Testar confirmação com código válido/inválido

---

### Fase 6: Testes & QA (Tempo: 2-3 dias)
**Prioridade**: CRÍTICA

**Testes automatizados**:
- ✓ Geração de código com prefixo correto (01/11)
- ✓ Hash do código armazenado corretamente
- ✓ Validação bem-sucedida com código correto
- ✓ Rejeição com código incorreto
- ✓ Limite de 3 tentativas + bloqueio
- ✓ Transições de status corretas
- ✓ Cancelamento automático após 7 dias
- ✓ Restauração de estoque
- ✓ Envio de emails (verificar conteúdo)
- ✓ Auditoria registrando todas as ações

**Testes manuais**:
- ✓ Fluxo completo: checkout → retirada → confirmação
- ✓ Fluxo pagamento online + retirada
- ✓ Fluxo pagamento na retirada
- ✓ Cliente perdeu código (busca por email/CPF)
- ✓ Tentativas suspeitas (notificação)
- ✓ Cancelamento manual vs automático
- ✓ Admin pode editar local/horário
- ✓ Relatórios geram corretamente
- ✓ Exportação CSV/PDF funciona

**Verificação**: Relatório de bugs/issues resolvidos

---

## T. Checklist Final de Validacao

Antes de colocar em produção:

- [ ] Database migrations executadas com sucesso
- [ ] Seed data inserido (local padrão)
- [ ] APIs testadas com casos de sucesso e erro
- [ ] Frontend cliente renderiza corretamente
- [ ] Frontend admin valida códigos com sucesso
- [ ] Emails sendo enviados com template correto
- [ ] Scheduled jobs rodando nas horas certas
- [ ] Estoque sendo restaurado após cancelamento
- [ ] Auditoria registrando todas as tentativas
- [ ] Limites de tentativa funcionando (3 falhas + bloqueio)
- [ ] Relatórios gerando dados corretos
- [ ] Exportação CSV/PDF funcionando
- [ ] Testes de carga com múltiplos pedidos/tentativas
- [ ] Documentação da API atualizada
- [ ] Documentação do admin atualizada
- [ ] Deploy em staging OK
- [ ] Testes em staging com dados reais
- [ ] Deploy em produção com backup prévio

---

## U. Notas Importantes para Desenvolvimento

1. **Segurança**
   - NUNCA armazenar código em plaintext
   - SEMPRE mascarar logs (01****56 em vez de 01123456)
   - Usar HTTPS para toda comunicação
   - Validar input no backend (não confiar em cliente)

2. **Performance**
   - Indexar campos: `entrega_tipo`, `status`, `retirada_prazo_vencimento` em `pedidos`
   - Indexar `pedido_id` em `retirada_auditoria`
   - Cache de `retirada_config` (para evitar queries frequentes)

3. **UX**
   - Código deve ser grande e facilmente copiável (mobile-friendly)
   - Mensagens de erro claras e em português
   - Feedback visual imediato (validação em tempo real)
   - Confirmação antes de ações críticas

4. **Dados**
   - Backup de `retirada_auditoria` regularmente
   - Arquivar dados antigos (> 1 ano) se necessário
   - Manter histórico completo para compliance

5. **Monitoramento**
   - Alertar se tentativas suspeitas frequentes
   - Monitorar tempo de resposta da API
   - Alertar se scheduled jobs falharem
   - Dashboard com KPIs: taxa de retirada, tempo médio, cancelamentos

---

## V. Proximos Passos Imediatos

1. ✅ **Análise completa** (FEITO): Todas as 52 questões respondidas e consolidadas
2. 📋 **Revisar documento** (PRÓXIMO): Validar com stakeholder se todas as decisões estão OK
3. 🗄️ **Criar migrations** (PRÓXIMO): Script SQL para banco de dados
4. 🔧 **Implementar backend** (PRÓXIMO): Endpoints e lógica principal
5. 🎨 **Implementar frontend** (DEPOIS): UI cliente + admin
6. ✅ **Testar** (DEPOIS): Todos os cenários

**Pronto para começar a implementação!**

