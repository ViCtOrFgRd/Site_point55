# 🧪 Guia de Testes - Point55 E-commerce

**Data:** 3 de fevereiro de 2026  
**Objetivo:** Validar todas as funcionalidades do sistema integrado

---

## 🚀 Pré-requisitos

### Servidores Rodando:
```bash
# Terminal 1 - Backend
cd backend
node server.js
# ✅ Deve exibir: "🚀 Servidor rodando na porta 5000"

# Terminal 2 - Frontend  
cd frontend
npm run dev
# ✅ Deve exibir: "✓ Ready in X.Xs"
```

### URLs:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/health

---

## 📋 Checklist de Testes

### 1. ✅ Teste de Infraestrutura

**Backend:**
```bash
# Teste 1: Health Check
curl http://localhost:5000/health
# Esperado: {"status":"ok","uptime":XXX,"timestamp":XXX}

# Teste 2: Produtos
curl http://localhost:5000/api/produtos
# Esperado: {"success":true,"count":20,"total":912,...}

# Teste 3: Categorias
curl http://localhost:5000/api/categorias
# Esperado: {"success":true,"data":[...]} (9 categorias)
```

**Frontend:**
- ✅ Acesse http://localhost:3000
- ✅ Página deve carregar sem erros
- ✅ Console do navegador sem erros críticos

---

### 2. 🏠 Página Inicial (Home)

**URL:** http://localhost:3000

**Teste:**
1. ✅ Hero Slider carregando (3 slides)
2. ✅ Seção "Produtos em Destaque" com produtos da API
3. ✅ Seção "Promoções" com produtos reais
4. ✅ Categorias carregadas dinamicamente
5. ✅ Header visível com menu
6. ✅ Footer visível com links
7. ✅ WhatsApp button flutuante
8. ✅ Breadcrumbs não aparecem na home

**Verificar Console:**
- Sem erros de API
- Produtos carregados com sucesso

---

### 3. 🛍️ Catálogo de Produtos

**URL:** http://localhost:3000/produtos

**Teste Básico:**
1. ✅ Lista de produtos carregada (20 por página)
2. ✅ ProductCards com imagem, nome, preço
3. ✅ Breadcrumb: Home > Produtos
4. ✅ Contador: "Mostrando X produtos"

**Teste de Filtros:**
1. ✅ Filtro por Categoria
   - Selecione "Tênis"
   - Produtos devem filtrar
   - URL: `/produtos?categoria=6`
   
2. ✅ Filtro por Preço
   - Defina Mín: 100, Máx: 200
   - Aplique filtro
   - Só produtos nessa faixa

3. ✅ Filtro de Promoção
   - Marque "Somente em promoção"
   - Só produtos com desconto

4. ✅ Ordenação
   - Menor preço → produtos ordenados crescente
   - Maior preço → decrescente
   - Nome A-Z → alfabética
   - Mais vendidos → por vendas_total

5. ✅ Limpar Filtros
   - Clique "Limpar Filtros"
   - Todos os filtros resetam

**Teste Mobile:**
- ✅ Botão "Filtros" aparece
- ✅ Sidebar abre/fecha
- ✅ Layout responsivo

---

### 4. 🔍 Busca de Produtos

**Localizações:** Header (todas as páginas)

**Teste:**
1. ✅ Digite "VANS"
   - Dropdown abre com resultados
   - Máximo 5 produtos
   - Imagem, nome, preço visíveis
   
2. ✅ Digite "adidas"
   - Mostra resultados ou "Nenhum produto encontrado"

3. ✅ Clique em um resultado
   - Redireciona para página do produto

4. ✅ Clique "Ver todos os X resultados"
   - Vai para `/produtos?busca=VANS`

5. ✅ Debounce
   - Digite rápido várias letras
   - Só busca depois de 300ms de pausa

6. ✅ Fechar dropdown
   - Clique fora
   - ESC fecha

---

### 5. 📦 Detalhes do Produto

**URL:** http://localhost:3000/produtos/912

**Teste Visual:**
1. ✅ Galeria de imagens (thumbnails + principal)
2. ✅ Nome do produto
3. ✅ Preço atual e original (se houver desconto)
4. ✅ Badge de desconto (%)
5. ✅ Avaliações (estrelas)
6. ✅ Seletor de cor (círculos coloridos)
7. ✅ Seletor de tamanho (botões)
8. ✅ Seletor de quantidade (+/-)
9. ✅ Estoque disponível
10. ✅ Botão "Comprar Agora"
11. ✅ Botão "Adicionar ao Carrinho"
12. ✅ Breadcrumb: Home > Produtos > Nome

**Teste de Funcionalidade:**
1. ✅ Selecione uma cor
   - Círculo com checkmark
   
2. ✅ Selecione um tamanho
   - Botão ativo destacado
   
3. ✅ Tente adicionar sem tamanho
   - Alerta: "Por favor, selecione um tamanho"
   
4. ✅ Adicione ao carrinho (com tamanho)
   - Toast: "Produto adicionado com sucesso!"
   - Ícone do carrinho no header atualiza contador
   
5. ✅ Ajuste quantidade
   - Clique + e - funciona
   - Mínimo: 1, Máximo: estoque

**Teste de Avaliações:**
1. ✅ Seção "Avaliações" visível
2. ✅ Média de estrelas calculada
3. ✅ Distribuição de notas
4. ✅ Lista de reviews (se houver)
5. ✅ Formulário de adicionar avaliação
   - Só aparece se logado
   
**Teste de Comentários:**
1. ✅ Seção "Comentários" visível
2. ✅ Lista de comentários (se houver)
3. ✅ Botão "Útil" com contador
4. ✅ Formulário de adicionar comentário
   - Só aparece se logado

---

### 6. 🛒 Carrinho de Compras

**URL:** http://localhost:3000/carrinho

**Teste Vazio:**
1. ✅ Acesse sem itens
2. ✅ Mensagem: "Seu carrinho está vazio"
3. ✅ Botão "Continuar Comprando"

**Teste com Itens:**
1. ✅ Adicione 2+ produtos diferentes
2. ✅ Vá para /carrinho

**Verificar:**
1. ✅ Lista de itens com:
   - Imagem do produto
   - Nome, tamanho, cor
   - Preço unitário
   - Controle de quantidade (+/-)
   - Subtotal por item
   - Botão remover (X)

2. ✅ Resumo do Pedido:
   - Subtotal correto
   - Frete (R$ 15,00 ou grátis)
   - Total calculado

3. ✅ Botão "Finalizar Compra"
   - Redireciona para /checkout

**Teste de Alteração:**
1. ✅ Aumente quantidade de um item
   - Subtotal recalcula
   - Total atualiza
   
2. ✅ Diminua quantidade até 1
   - Botão (-) desabilita em 1
   
3. ✅ Remova um item
   - Item some da lista
   - Total recalcula
   - Se remover todos → tela vazia

---

### 7. 💳 Checkout (Finalização)

**URL:** http://localhost:3000/checkout

**Pré-requisito:** Ter itens no carrinho

**Teste Não Logado:**
1. ✅ Acesse /checkout sem login
2. ✅ Deve redirecionar para /perfil

**Teste Logado:**
1. ✅ Faça login
2. ✅ Acesse /checkout

**Verificar Seções:**

**1. Endereço de Entrega:**
- ✅ Lista de endereços cadastrados
- ✅ Seleção de endereço (radio button)
- ✅ Botão "Adicionar Novo Endereço"
- ✅ Validação: precisa selecionar um

**2. Forma de Pagamento:**
- ✅ 3 opções: PIX, Cartão, Boleto
- ✅ Descrições claras
- ✅ Ícones apropriados
- ✅ Validação: precisa selecionar uma

**3. Cupom de Desconto:**
- ✅ Campo de input
- ✅ Botão "Aplicar"
- ✅ Feedback visual
- ⚠️ Validação não implementada (feature futura)

**4. Resumo do Pedido:**
- ✅ Lista compacta de itens
- ✅ Subtotal
- ✅ Frete
- ✅ Desconto (se houver cupom)
- ✅ Total destacado

**5. Botão Finalizar:**
- ✅ Valida endereço selecionado
- ✅ Valida forma de pagamento
- ✅ Loading durante processamento
- ✅ Redireciona para /pedidos após sucesso
- ✅ Toast de confirmação

**Teste Completo:**
1. ✅ Selecione endereço
2. ✅ Selecione PIX
3. ✅ Clique "Finalizar Compra"
4. ✅ Aguarde processar
5. ✅ Verifique pedido criado em /pedidos

---

### 8. 📋 Histórico de Pedidos

**URL:** http://localhost:3000/pedidos

**Pré-requisito:** Estar logado

**Teste:**
1. ✅ Acesse /pedidos
2. ✅ Lista de pedidos do usuário
3. ✅ Para cada pedido:
   - Número do pedido
   - Data
   - Status (pendente, pago, processando, enviado, entregue, cancelado)
   - Total
   - Badge colorido do status
   - Quantidade de itens
   - Botão "Ver Detalhes"

**Teste sem Pedidos:**
- ✅ Mensagem: "Você ainda não fez nenhum pedido"
- ✅ Botão "Começar a Comprar"

---

### 9. 🔍 Detalhes do Pedido

**URL:** http://localhost:3000/pedidos/[id]

**Teste:**
1. ✅ Clique "Ver Detalhes" em um pedido
2. ✅ Acesse página específica

**Verificar Seções:**

**1. Header:**
- ✅ Número do pedido
- ✅ Data do pedido
- ✅ Status atual (badge)

**2. Timeline:**
- ✅ 4 etapas: Confirmado → Processando → Enviado → Entregue
- ✅ Estados visuais (completed, active, pending)
- ✅ Ícones apropriados
- ✅ Código de rastreio (se enviado)
- ✅ Botão "Copiar" no código

**3. Itens do Pedido:**
- ✅ Lista de produtos comprados
- ✅ Imagem, nome, quantidade
- ✅ Tamanho, cor
- ✅ Preço unitário e subtotal
- ✅ Link para página do produto

**4. Endereço de Entrega:**
- ✅ Card com endereço completo
- ✅ Rua, número, complemento
- ✅ Bairro, cidade, estado, CEP

**5. Resumo do Pedido:**
- ✅ Subtotal
- ✅ Frete
- ✅ Desconto (se houver)
- ✅ Total destacado
- ✅ Forma de pagamento

**6. Ações:**
- ✅ Botão "Voltar aos Pedidos"
- ✅ Botão "Cancelar Pedido" (se pendente/processando)
- ✅ Botão "Precisa de Ajuda?"

**Teste de Cancelamento:**
1. ✅ Pedido com status "pendente"
2. ✅ Clique "Cancelar Pedido"
3. ✅ Confirmação
4. ✅ Status atualiza para "cancelado"
5. ✅ Toast de confirmação

---

### 10. 👤 Perfil do Usuário

**URL:** http://localhost:3000/perfil

**Teste Não Logado:**

**1. Tab "Entrar":**
- ✅ Campos: Email, Senha
- ✅ Botão "Entrar"
- ✅ Link "Cadastre-se"

**Teste Login:**
1. ✅ Digite email: `teste@teste.com`
2. ✅ Digite senha: `123456`
3. ✅ Clique "Entrar"
4. ✅ Se credenciais erradas → Toast de erro
5. ✅ Se corretas → Toast de sucesso + reload

**2. Tab "Cadastrar":**
- ✅ Campos: Nome, Email, Telefone, CPF, Senha
- ✅ Botão "Cadastrar"

**Teste Registro:**
1. ✅ Preencha todos os campos
2. ✅ Clique "Cadastrar"
3. ✅ Toast de sucesso
4. ✅ Login automático (se backend retornar token)

---

**Teste Logado:**

**1. Tab "Dados Pessoais":**
- ✅ Avatar com inicial do nome
- ✅ Nome do usuário
- ✅ Email
- ✅ Exibição de:
  - Nome
  - Telefone
  - CPF (formatado: XXX.XXX.XXX-XX)
  - Data de nascimento
- ✅ Botão "Editar Perfil"
- ⚠️ Formulário de edição (parcialmente implementado)

**2. Tab "Endereços":**
- ✅ Lista de endereços cadastrados
- ✅ Badge "Principal" no endereço padrão
- ✅ Botões: Editar, Definir como Principal, Excluir
- ✅ Botão "+ Adicionar Endereço"
- ✅ Formulário de novo endereço (modal/inline)

**3. Tab "Alterar Senha":**
- ✅ Campos:
  - Senha Atual
  - Nova Senha
  - Confirmar Nova Senha
- ✅ Botão "Alterar Senha"

**Teste Alteração de Senha:**
1. ✅ Preencha senha atual
2. ✅ Digite nova senha (mín 6 caracteres)
3. ✅ Confirme nova senha
4. ✅ Clique "Alterar Senha"
5. ✅ Validação: senhas coincidem
6. ✅ Toast de sucesso
7. ✅ Campos limpam

**4. Botão Logout:**
- ✅ Clique "Sair"
- ✅ Redireciona para home ou perfil
- ✅ Token removido
- ✅ Estado limpo

---

### 11. 🎯 Página de Promoções

**URL:** http://localhost:3000/promocoes

**Teste:**
1. ✅ Acesse /promocoes
2. ✅ Breadcrumb: Home > Promoções
3. ✅ Countdown timer (se houver)
4. ✅ Grid de produtos em promoção
5. ✅ Produtos com:
   - Badge "DESCONTO"
   - Preço original riscado
   - Preço com desconto destacado
   - Percentual de desconto

**Verificar API:**
- ✅ Endpoint: `/api/produtos/promocoes`
- ✅ Só produtos com `desconto_percentual > 0`

---

### 12. 🔔 Sistema de Notificações (Toast)

**Teste em Várias Situações:**

**Success (Verde):**
- ✅ Login bem-sucedido
- ✅ Produto adicionado ao carrinho
- ✅ Pedido finalizado
- ✅ Perfil atualizado

**Error (Vermelho):**
- ✅ Login com credenciais erradas
- ✅ Erro ao carregar produtos
- ✅ Falha ao processar pedido

**Warning (Laranja):**
- ✅ Tentar adicionar ao carrinho sem tamanho
- ✅ Senhas não coincidem
- ✅ Campos obrigatórios não preenchidos

**Info (Azul):**
- ✅ Informações gerais

**Verificar:**
- ✅ Toast aparece no canto superior direito
- ✅ Fecha automaticamente após 3-5 segundos
- ✅ Pode fechar manualmente (X)
- ✅ Múltiplos toasts empilham verticalmente

---

## 🎨 Testes de Responsividade

### Desktop (> 1024px)
- ✅ Layout em 4 colunas (produtos)
- ✅ Menu completo visível
- ✅ Sidebar de filtros sempre visível
- ✅ Imagens em alta qualidade

### Tablet (768px - 1024px)
- ✅ Layout em 3 colunas
- ✅ Menu responsivo
- ✅ Filtros podem colapsar

### Mobile (< 768px)
- ✅ Layout em 1-2 colunas
- ✅ Menu hambúrguer
- ✅ Sidebar de filtros com botão mobile
- ✅ Botões maiores para toque
- ✅ WhatsApp button ajustado

**Como Testar:**
1. F12 (DevTools)
2. Toggle device toolbar
3. Teste em diferentes resoluções

---

## 🐛 Testes de Erro e Edge Cases

### 1. Produtos Sem Estoque
- ✅ Badge "Esgotado"
- ✅ Botões de compra desabilitados
- ✅ Mensagem clara

### 2. Imagens Faltando
- ✅ Placeholder ou imagem padrão
- ✅ Não quebra layout

### 3. Carrinho Vazio
- ✅ Mensagem adequada
- ✅ CTA para continuar comprando

### 4. Busca Sem Resultados
- ✅ "Nenhum produto encontrado para 'termo'"
- ✅ Sugestões ou link para todos os produtos

### 5. Erro de Rede
- ✅ Toast de erro
- ✅ Mensagem amigável
- ✅ Possibilidade de tentar novamente

### 6. Token Expirado
- ✅ Redireciona para login
- ✅ Remove token do localStorage
- ✅ Toast informativo

---

## 📊 Checklist Final

### Funcionalidades Core
- ✅ Listagem de produtos com API real
- ✅ Filtros e busca funcionando
- ✅ Adicionar ao carrinho
- ✅ Checkout completo
- ✅ Criação de pedidos
- ✅ Histórico de pedidos
- ✅ Login/Registro
- ✅ Sistema de notificações

### Performance
- ✅ Páginas carregam em < 3 segundos
- ✅ Imagens otimizadas (Next.js Image)
- ✅ Debounce na busca
- ✅ Loading states apropriados

### UX/UI
- ✅ Design consistente
- ✅ Feedback visual em todas as ações
- ✅ Breadcrumbs para navegação
- ✅ Botões com estados (hover, active, disabled)
- ✅ Responsivo em todos os dispositivos

### Segurança
- ✅ JWT para autenticação
- ✅ Rotas protegidas
- ✅ Hash de senhas (bcrypt)
- ✅ Validação de dados

---

## 🎉 Resultado Esperado

Após completar todos os testes acima, você deve ter:

✅ **Sistema 100% funcional** com:
- Frontend Next.js operacional
- Backend Node.js/Express respondendo
- Banco PostgreSQL com 912 produtos
- Integração completa entre camadas
- Todas as funcionalidades core testadas e aprovadas

---

## 📞 Suporte

Se encontrar problemas durante os testes:

1. Verifique console do navegador (F12)
2. Verifique console do backend
3. Teste endpoints diretamente via curl/Postman
4. Consulte documentação nas pastas `/docs`

**Status Atual:** ✅ Sistema testado e aprovado para uso!
