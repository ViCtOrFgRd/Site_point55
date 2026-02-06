**Site de Vendas de Produtos**

Este é um site de vendas de produtos desenvolvido para facilitar a compra e venda de itens diversos. O site oferece uma interface amigável para os usuários navegarem pelos produtos, adicioná-los ao carrinho e finalizar a compra.

**Nome da Loja:** Point55

---

## 📚 Documentação Técnica Recente

### 🔧 Correções e Melhorias (04/02/2026)

- **[CORRECAO-TOFIXED-ERRO.md](./CORRECAO-TOFIXED-ERRO.md)** - Correção crítica de erro "toFixed is not a function" em páginas de valores monetários e fix do CSS da área do usuário

### 📋 Relatórios Anteriores

- [RELATORIO-FINAL-CORRECAO-ADMIN.md](./RELATORIO-FINAL-CORRECAO-ADMIN.md)
- [RELATORIO-VERIFICACAO-AREA-ADMIN.md](./RELATORIO-VERIFICACAO-AREA-ADMIN.md)
- [RELATORIO-VERIFICACAO-FILTROS.md](./RELATORIO-VERIFICACAO-FILTROS.md)
- [VERIFICACAO-COMPLETA-ETAPAS-1-4.md](./VERIFICACAO-COMPLETA-ETAPAS-1-4.md)

---

**Descrição do Projeto**
O projeto consiste em um site de vendas de produtos que permite aos usuários navegar por diversas categorias, visualizar detalhes dos produtos, adicionar itens ao carrinho e concluir a compra de forma segura. O site também oferece funcionalidades como avaliações de produtos, histórico de pedidos e promoções especiais.

**Ideia do Layout**
https://www.useelizah.com.br/?srsltid=AfmBOooTtXsSLW2MCa4gWb6R5KFdfhBzUe3YNCYYvJh6k5uVtjtzOTyQ

**Especificações de Design e Layout**

**Paleta de Cores:**
- Cores principais: Branco (#FFFFFF), Preto (#000000)
- Cores de destaque: Azul/preto para badges de desconto
- Cores neutras: Cinza claro para fundos e divisões
- Texto: Preto para títulos, Cinza escuro para descrições
- Ideia do logan : Raio azul e preto

**Estrutura do Header:**
- Logo centralizado ou à esquerda
- Menu de navegação horizontal com categorias principais
- Ícone de carrinho com contador de itens
- Ícone de conta do usuário
- Barra de busca visível
- Banner de promoção no topo (ex: "5% OFF COM O CUPOM: PRIMEIRACOMPRA")

**Página Inicial (Home):**
- Banner principal rotativo (Hero Slider) em tela cheia
  - Imagens de promoções especiais (ex: "MEGA BAZAR")
  - Call-to-action visível
- Seção de categorias principais
- Grid de produtos em destaque
- Seção de produtos em promoção com "mega bazar/"
- Seção de avaliações de clientes ("o que estão falando da gente/")
- Links rápidos: WhatsApp, Revenda, Dúvida no Tamanho, Loja Física

**Cards de Produtos:**
- Imagem do produto em destaque (hover com segunda imagem opcional)
- Badge de selo no canto superior (ex: "BEST SELLER", "+11 MIL VENDIDAS")
- Badge de desconto em percentual (ex: "67% OFF")
- Nome do produto em maiúsculas
- Preço riscado (de R$) seguido do preço promocional (por R$)
- Opção de parcelamento (ex: "3x de R$X sem juros")
- Preço com PIX destacado
- Contador de tempo para promoções limitadas ("Termina em XXh XXm XXs")
- Variações de cores visíveis (bolinhas coloridas)

**Grid de Produtos:**
- Layout em grid responsivo (4 colunas desktop, 2 mobile)
- Espaçamento equilibrado entre produtos
- Carregamento com lazy loading
- Botão "Ver mais" ou paginação

**Página de Produto:**
- Galeria de imagens (principal + miniaturas)
- Seletor de tamanho visível
- Seletor de cor com preview
- Informações de estoque
- Botão de adicionar ao carrinho em destaque
- Opção de compra rápida via WhatsApp
- Tabela de medidas
- Seção de avaliações e comentários
- Produtos relacionados

**Carrinho de Compras:**
- Lateral deslizante (sidebar) ou página dedicada
- Imagem em miniatura do produto
- Controles de quantidade (+/-)
- Cálculo automático de subtotal
- Exibição de descontos aplicados
- Preço total com PIX destacado
- Botão de finalizar compra proeminente

**Checkout:**
- Processo em etapas (identificação, endereço, pagamento)
- Resumo do pedido sempre visível
- Opções de pagamento com ícones de bandeiras
- Cupom de desconto
- Cálculo de frete

**Seção de Avaliações:**
- Card com foto do produto
- Nome do cliente
- Texto da avaliação
- Sistema de estrelas
- Carrossel horizontal de avaliações
- Link para "Ver todas as avaliações"

**Footer:**
- Newsletter com campo de e-mail ("OBTENHA DESCONTOS EXCLUSIVOS")
- Links de redes sociais (Instagram, TikTok)
- Seção "Sua Conta" (Minha conta, Minhas compras, Carrinho)
- Seção "Institucional" (Política de privacidade, FAQ)
- Seção "Atendimento" (WhatsApp, Email, Horário)
- Seção "Precisa de Ajuda?" (Política de Frete, Trocas, Rastreio)
- Formas de pagamento (bandeiras de cartões)
- Selos de segurança e avaliações

**Elementos Interativos:**
- Contador de tempo regressivo para promoções
- Botão flutuante de WhatsApp
- Menu sticky (fixo ao rolar)
- Animações suaves de hover nos produtos
- Modal de aviso de cookies

**Tipografia:**
- Fontes sans-serif limpas e modernas
- Títulos em negrito e maiúsculas para destaque
- Textos de preço em tamanho grande e legível

**Badges e Selos:**
- "BEST SELLER" - Fundo com cor de destaque
- "+X MIL VENDIDAS" - Indicador de popularidade
- "X% OFF" - Badge de desconto em vermelho/rosa
- "Termina em XXh" - Senso de urgência

**Responsividade:**
- Mobile-first design
- Menu hamburguer no mobile
- Grid adaptável (1 coluna mobile, 2-4 desktop)
- Imagens otimizadas para diferentes telas
- Touch-friendly (botões e links com tamanho adequado)

**Técnicologias Utilizadas**
- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Next.js
- React.js
- Node.js
- PostgreSQL


**Funcionalidades**
- Registro e login de usuários
- Navegação por categorias de produtos
- Visualização detalhada de produtos com galeria de imagens
- Adição de produtos ao carrinho
- Seletor de tamanhos e cores/variações
- Processo de checkout com pagamento (cartão, PIX, boleto)
- Histórico de pedidos para usuários
- Sistema de rastreamento de pedidos
- Área de promoções e descontos com contador de tempo
- Sistema de avaliações e comentários de produtos
- Carrossel de avaliações de clientes
- Catálogo de produtos com imagens, descrições e preços
- Sistema de busca e filtragem avançada de produtos
- Carrinho de compras interativo (lateral ou página dedicada)
- Processo de checkout seguro em etapas
- Cálculo de frete integrado
- Sistema de cupons de desconto
- Newsletter para descontos exclusivos
- Botão de WhatsApp para atendimento e compras
- Tabela de medidas para produtos
- Sistema de badges e selos (Best Seller, mais vendidos)
- Banner rotativo na home (Hero Slider)
- Links rápidos (Atacado, Loja Física, Dúvidas)
- Área de administração para gerenciar produtos, categorias e pedidos
- Integração com gateways de pagamento
- Sistema de moderação de avaliações
- Contador de itens no carrinho (badge no ícone)
- Produtos relacionados/sugeridos
- Seção "Você também pode gostar"

**Etapa 1: Configuração do Ambiente**

1.1. **Preparar o Ambiente de Desenvolvimento**
   - Verificar se está instalado Node.js (comando: `node --version`), caso não esteja, instalar Node.js (versão LTS recomendada)
   - Verificar se npm ou yarn está instalado (comando: `npm --version` ou `yarn --version`), caso não, instalar como gerenciador de pacotes
   - Verificar se possui um editor de código instalado, caso não, instalar (VS Code recomendado)
   - Verificar se Git está instalado (comando: `git --version`), caso não, instalar Git para controle de versão

1.2. **Configurar o Projeto**
   - Verificar se pasta do projeto existe, caso não, criar uma pasta para o projeto
   - Verificar se repositório Git está inicializado (verificar se existe pasta .git), caso não, inicializar repositório Git
   - Verificar se arquivo .gitignore existe, caso não, criar arquivo .gitignore para Node.js e Next.js

1.3. **Instalar PostgreSQL**
   - Verificar se PostgreSQL está instalado (comando: `psql --version`), caso não, baixar e instalar PostgreSQL
   - Configurar usuário e senha do banco de dados
   - Verificar se possui ferramenta de gerenciamento instalada, caso não, instalar (pgAdmin ou DBeaver)

1.4. **Criar Banco de Dados**
   - Verificar se banco de dados do projeto existe, caso não, criar um novo banco de dados para o projeto
   - Verificar se tabelas existem, caso não, definir schema inicial:
     * produtos (id, nome, descricao, preco, preco_original, desconto_percentual, categoria_id, estoque, imagens, cores_disponiveis, tamanhos_disponiveis, ativo)
     * categorias (id, nome, slug, imagem, ordem, ativa)
     * usuarios (id, nome, email, senha_hash, telefone, data_cadastro, ativo)
     * pedidos (id, usuario_id, status, subtotal, desconto, total, forma_pagamento, codigo_rastreio, data_pedido)
     * itens_pedido (id, pedido_id, produto_id, quantidade, preco_unitario, subtotal, tamanho, cor)
     * avaliacoes (id, produto_id, usuario_id, nota, data_avaliacao, verificado_compra)
     * comentarios (id, produto_id, usuario_id, texto, data_comentario, curtidas, verificado_compra)
     * promocoes (id, nome, desconto_percentual, desconto_valor, data_inicio, data_fim, ativa, produtos_aplicaveis)
     * badges (id, nome, tipo, cor, icone) - para "Best Seller", "+X vendidos"
     * cupons (id, codigo, tipo_desconto, valor_desconto, data_validade, ativo, usos_maximos, usos_atuais)
     * newsletter (id, email, data_inscricao, ativo)
   - Verificar se índices existem, caso não, criar índices necessários para otimização

1.5. **Configurar Variáveis de Ambiente**
   - Verificar se arquivo .env.local existe, caso não, criar arquivo .env.local na raiz do projeto
   - Definir variáveis: DATABASE_URL, API_KEY, SECRET_KEY
   - Verificar se .env.local está no .gitignore, caso não, adicionar .env.local ao .gitignore

**Etapa 2: Desenvolvimento do Frontend**

2.1. **Inicializar Projeto Next.js**
   - Verificar se projeto Next.js já existe (verificar se há pasta com package.json do Next.js), caso não, executar comando: `npx create-next-app@latest`
   - Verificar se TypeScript está configurado, caso deseje usar, configurar TypeScript (opcional mas recomendado)
   - Verificar estrutura de pastas existente e criar as que faltam (pages, components, styles, public)

2.2. **Instalar Dependências do Frontend**
   - Verificar se Bootstrap já está instalado (verificar package.json), caso não, instalar: `npm install bootstrap`
   - Verificar se React Icons está instalado, caso não, instalar: `npm install react-icons`
   - Verificar se Axios está instalado, caso não, instalar: `npm install axios`
   - Verificar se possui biblioteca de gerenciamento de estado, caso não, instalar (Redux ou Context API)

2.3. **Criar Estrutura de Componentes**
   - Criar componente Header (logo, menu, carrinho, busca, ícone de usuário)
   - Criar componente TopBanner (banner de cupom/promoção no topo)
   - Criar componente Footer (newsletter, links, redes sociais, selos)
   - Criar componente HeroSlider (carrossel principal de banners)
   - Criar componente ProductCard (imagem, badges, preços, contador)
   - Criar componente ProductGrid (grid responsivo de produtos)
   - Criar componente SearchBar (barra de busca com auto-complete)
   - Criar componente FilterSidebar (filtros laterais)
   - Criar componente CategoryMenu (navegação por categorias)
   - Criar componente PromoBanner (área de promoções "mega bazar")
   - Criar componente ReviewCard (avaliações e comentários)
   - Criar componente ReviewCarousel (carrossel de avaliações)
   - Criar componente RatingStars (sistema de classificação)
   - Criar componente PriceBadge (exibição de preços com desconto)
   - Criar componente DiscountBadge (badge de percentual de desconto)
   - Criar componente CountdownTimer (contador regressivo de promoções)
   - Criar componente ProductBadge (selos: Best Seller, +X vendidos)
   - Criar componente ColorSelector (seletor de cores/variações)
   - Criar componente SizeSelector (seletor de tamanhos)
   - Criar componente WhatsAppButton (botão flutuante de WhatsApp)
   - Criar componente QuickLinks (links rápidos: atacado, loja física, etc)
   - Criar componente NewsletterForm (formulário de inscrição newsletter)
   - Criar componente PaymentIcons (ícones de formas de pagamento)
   - Criar componente TrustBadges (selos de segurança e avaliações)

2.4. **Desenvolver Páginas Principais**
   - Criar página Home (index.js)
   - Criar página de Catálogo de Produtos
   - Criar página de Produtos por Categoria
   - Criar página de Detalhes do Produto (com avaliações e comentários)
   - Criar página do Carrinho de Compras
   - Criar página de Checkout
   - Criar página de Confirmação de Pedido
   - Criar página de Histórico de Pedidos do Usuário
   - Criar página de Promoções e Descontos
   - Criar página de Perfil do Usuário

2.5. **Implementar Carrinho de Compras**
   - Criar lógica para adicionar produtos ao carrinho
   - Implementar atualização de quantidade
   - Implementar remoção de produtos
   - Calcular subtotal e total
   - Persistir carrinho no localStorage

2.6. **Estilizar Interface**
   - Configurar tema do Bootstrap com cores personalizadas (branco, preto, rosa/vermelho)
   - Criar arquivo de estilos globais (variáveis CSS, tipografia, espaçamentos)
   - Implementar design responsivo para mobile (grid 1-2-4 colunas)
   - Estilizar badges e selos (Best Seller, desconto, vendidos)
   - Criar estilos para cards de produtos (hover, transições)
   - Estilizar componentes de preço (riscado, destaque, PIX)
   - Implementar menu sticky (fixo ao rolar)
   - Estilizar contador de tempo regressivo
   - Criar animações de hover suaves
   - Estilizar formulário de newsletter
   - Implementar botão flutuante de WhatsApp
   - Estilizar carrossel de avaliações
   - Criar estilos para modal de cookies
   - Garantir acessibilidade (a11y, contraste, tamanhos touch-friendly)
   - Otimizar tipografia (sans-serif, tamanhos, pesos)

2.7. **Implementar Busca e Filtros**
   - Criar barra de busca com auto-complete
   - Implementar navegação e filtros por categoria
   - Implementar filtros por faixa de preço
   - Implementar filtro de produtos em promoção
   - Adicionar ordenação (preço, nome, popularidade, melhor avaliados)
   - Implementar breadcrumbs para navegação de categorias

2.8. **Implementar Sistema de Avaliações e Comentários**
   - Criar formulário para adicionar avaliações (1 a 5 estrelas)
   - Implementar área de comentários para produtos
   - Exibir média de avaliações por produto
   - Implementar filtro de comentários (mais recentes, mais úteis)
   - Adicionar funcionalidade de curtir/útil em comentários
   - Validar que apenas usuários logados podem avaliar

2.9. **Implementar Área de Promoções e Descontos**
   - Criar seção de produtos em promoção na home
   - Implementar banner rotativo de promoções
   - Exibir badge de desconto nos produtos
   - Calcular e exibir preço original e com desconto
   - Implementar contador de tempo para promoções limitadas

2.10. **Implementar Histórico de Pedidos**
   - Criar página com lista de pedidos do usuário
   - Exibir status de cada pedido (pendente, pago, enviado, entregue)
   - Permitir visualização detalhada de cada pedido
   - Implementar filtros por status e data
   - Adicionar opção de rastrear pedido

2.11. **Testes do Frontend**
   - Testar responsividade em diferentes dispositivos
   - Testar em diferentes navegadores (Chrome, Firefox, Safari, Edge)
   - Verificar performance com Lighthouse
   - Corrigir problemas de layout e usabilidade

**Etapa 3: Desenvolvimento do Backend** ✅ CONCLUÍDA

**Status Geral:** 100% - API REST completa e funcional  
**Data de Conclusão:** 3 de fevereiro de 2026  
**Documentação:** docs/etapa-3-conclusao.md

**Resumo de Implementação:**
- ✅ 44 endpoints da API implementados
- ✅ Sistema de autenticação JWT completo
- ✅ CRUD de categorias e produtos
- ✅ Gerenciamento de endereços
- ✅ Sistema completo de pedidos com controle de estoque
- ✅ Sistema de avaliações e comentários
- ✅ Proteção de rotas administrativas
- ✅ Transações de banco de dados
- ✅ Servidor rodando em http://localhost:5000

3.1. **Configurar Servidor Node.js** ✅ CONCLUÍDO
   - Verificar se pasta backend existe, caso não, criar pasta backend na raiz do projeto
   - Verificar se package.json existe na pasta backend, caso não, inicializar projeto Node: `npm init -y`
   - Verificar se Express está instalado, caso não, instalar: `npm install express`
   - Verificar se arquivo server.js existe, caso não, criar arquivo server.js

3.2. **Instalar Dependências do Backend**
   - Verificar se pg está instalado (verificar package.json do backend), caso não, instalar: `npm install pg`
   - Verificar se dotenv está instalado, caso não, instalar: `npm install dotenv`
   - Verificar se cors está instalado, caso não, instalar: `npm install cors`
   - Verificar se bcrypt está instalado, caso não, instalar: `npm install bcrypt`
   - Verificar se jsonwebtoken está instalado, caso não, instalar: `npm install jsonwebtoken`
   - Verificar se express-validator está instalado, caso não, instalar: `npm install express-validator`

3.3. **Configurar Conexão com Banco de Dados**
   - Criar arquivo db.js para conexão PostgreSQL
   - Implementar pool de conexões
   - Testar conexão com o banco

3.4. **Criar Rotas da API - Categorias**
   - GET /api/categorias - Listar todas as categorias
   - GET /api/categorias/:id - Obter categoria específica
   - GET /api/categorias/:id/produtos - Listar produtos por categoria
   - POST /api/categorias - Criar nova categoria (admin)
   - PUT /api/categorias/:id - Atualizar categoria (admin)
   - DELETE /api/categorias/:id - Deletar categoria (admin)

3.5. **Criar Rotas da API - Produtos**
   - GET /api/produtos - Listar todos os produtos
   - GET /api/produtos/:id - Obter produto específico
   - GET /api/produtos/promocoes - Listar produtos em promoção
   - POST /api/produtos - Criar novo produto (admin)
   - PUT /api/produtos/:id - Atualizar produto (admin)
   - DELETE /api/produtos/:id - Deletar produto (admin)

3.6. **Criar Rotas da API - Usuários**
   - POST /api/usuarios/registro - Registrar novo usuário
   - POST /api/usuarios/login - Login de usuário
   - GET /api/usuarios/perfil - Obter perfil do usuário
   - PUT /api/usuarios/perfil - Atualizar perfil
   - GET /api/usuarios/:id/pedidos - Histórico de pedidos do usuário

3.7. **Criar Rotas da API - Pedidos**
   - POST /api/pedidos - Criar novo pedido
   - GET /api/pedidos - Listar pedidos do usuário
   - GET /api/pedidos/:id - Obter pedido específico
   - PUT /api/pedidos/:id/status - Atualizar status (admin)
   - GET /api/pedidos/:id/rastreamento - Obter informações de rastreamento

3.8. **Criar Rotas da API - Avaliações e Comentários**
   - POST /api/produtos/:id/avaliacoes - Criar avaliação para produto
   - GET /api/produtos/:id/avaliacoes - Listar avaliações de um produto
   - PUT /api/avaliacoes/:id - Atualizar avaliação
   - DELETE /api/avaliacoes/:id - Deletar avaliação
   - POST /api/produtos/:id/comentarios - Adicionar comentário
   - GET /api/produtos/:id/comentarios - Listar comentários de um produto
   - POST /api/comentarios/:id/util - Marcar comentário como útil

3.9. **Criar Rotas da API - Promoções**
   - GET /api/promocoes - Listar promoções ativas
   - GET /api/promocoes/:id - Obter promoção específica
   - POST /api/promocoes - Criar nova promoção (admin)
   - PUT /api/promocoes/:id - Atualizar promoção (admin)
   - DELETE /api/promocoes/:id - Deletar promoção (admin)

3.10. **Implementar Autenticação e Autorização**
   - Criar middleware de autenticação JWT
   - Criar middleware de autorização (verificar admin)
   - Implementar hash de senhas com bcrypt
   - Criar tokens de acesso e refresh

3.11. **Implementar Lógica de Negócio**
   - Validar dados de entrada
   - Implementar cálculo de preços e descontos
   - Implementar cálculo de promoções (percentual e valor fixo)
   - Gerenciar estoque de produtos
   - Calcular média de avaliações dos produtos
   - Implementar sistema de notificações por email
   - Implementar lógica de verificação de compra para avaliações

3.12. **Integrar Gateway de Pagamento**
   - Escolher gateway (Stripe, PayPal, Mercado Pago)
   - Verificar se SDK do gateway está instalado, caso não, instalar SDK do gateway escolhido
   - Implementar rotas de pagamento
   - Configurar webhooks para confirmação

3.13. **Testes do Backend**
   - Testar rotas com Postman ou Insomnia
   - Criar testes unitários com Jest
   - Testar validações e tratamento de erros
   - Testar autenticação e autorização
   - Testar cálculo de promoções e descontos
   - Testar sistema de avaliações e comentários

**Etapa 4: Integração Frontend e Backend**

4.1. **Configurar Comunicação API**
   - Criar serviço API no frontend (api.js)
   - Configurar baseURL do Axios
   - Implementar interceptors para tokens JWT
   - Criar funções para cada endpoint

4.2. **Integrar Catálogo de Produtos**
   - Buscar produtos da API no frontend
   - Integrar sistema de categorias
   - Integrar listagem de produtos em promoção
   - Implementar loading states
   - Implementar tratamento de erros
   - Adicionar paginação
   - Exibir média de avaliações nos produtos

4.3. **Integrar Autenticação**
   - Criar formulários de login e registro
   - Armazenar tokens no localStorage
   - Implementar proteção de rotas
   - Criar contexto de autenticação

4.4. **Integrar Carrinho e Checkout**
   - Enviar pedido para API
   - Aplicar descontos e promoções no carrinho
   - Processar pagamento
   - Exibir confirmação de pedido
   - Implementar página de acompanhamento

4.5. **Integrar Histórico de Pedidos**
   - Buscar histórico de pedidos do usuário
   - Exibir detalhes de cada pedido
   - Implementar atualização de status em tempo real
   - Integrar sistema de rastreamento

4.6. **Integrar Sistema de Avaliações**
   - Permitir usuários adicionarem avaliações
   - Exibir avaliações e comentários nos produtos
   - Implementar sistema de curtidas em comentários
   - Validar que usuário comprou o produto antes de avaliar
   - Calcular e exibir média de avaliações

4.7. **Criar Área de Administração**
   - Criar dashboard administrativo
   - Implementar CRUD de produtos
   - Implementar CRUD de categorias
   - Implementar CRUD de promoções
   - Criar página de gerenciamento de pedidos
   - Implementar moderação de avaliações e comentários
   - Implementar relatórios e estatísticas
   - Adicionar gráficos de vendas por categoria
   - Exibir produtos mais bem avaliados

**Etapa 5: Testes e Otimização**

5.1. **Testes de Integração**
   - Testar fluxo completo de compra
   - Testar aplicação de promoções e descontos
   - Testar navegação por categorias
   - Testar sistema de avaliações e comentários
   - Testar histórico de pedidos
   - Testar integração com gateway de pagamento
   - Verificar sincronização de dados
   - Testar área administrativa completa

5.2. **Testes de Usabilidade**
   - Realizar testes com usuários reais
   - Coletar feedback
   - Identificar pontos de melhoria

5.3. **Otimização de Performance**
   - Otimizar imagens (compressão, lazy loading)
   - Implementar cache no backend
   - Minimizar e comprimir arquivos CSS/JS
   - Implementar CDN para assets estáticos

5.4. **Implementar Segurança**
   - Configurar HTTPS
   - Implementar rate limiting
   - Adicionar proteção contra SQL Injection
   - Implementar proteção CSRF
   - Sanitizar inputs do usuário
   - Configurar CORS adequadamente

5.5. **Correção de Bugs**
   - Revisar logs de erros
   - Corrigir bugs identificados nos testes
   - Validar todas as correções

**Etapa 6: Preparação para Produção**

6.1. **Configurar Ambiente de Produção**
   - Escolher provedor de hospedagem (Vercel, AWS, Digital Ocean)
   - Configurar servidor de produção
   - Configurar banco de dados de produção

6.2. **Configurar CI/CD**
   - Configurar GitHub Actions ou GitLab CI
   - Criar pipeline de deploy automático
   - Configurar testes automatizados

6.3. **Deploy do Backend**
   - Fazer build do backend
   - Configurar variáveis de ambiente
   - Fazer deploy no servidor
   - Testar endpoints em produção

6.4. **Deploy do Frontend**
   - Fazer build do Next.js: `npm run build`
   - Configurar variáveis de ambiente de produção
   - Fazer deploy (Vercel recomendado para Next.js)
   - Testar site em produção

6.5. **Configurar Monitoramento**
   - Implementar logging (Winston, Morgan)
   - Configurar monitoramento de erros (Sentry)
   - Configurar analytics (Google Analytics)
   - Criar alertas para erros críticos

6.6. **Documentação**
   - Documentar API (Swagger/OpenAPI)
   - Criar guia de usuário
   - Documentar processo de deploy
   - Criar README completo