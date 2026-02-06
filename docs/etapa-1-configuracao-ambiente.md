# Etapa 1: Configuração do Ambiente - CONCLUÍDA ✅

**Projeto:** Point55 - Site de Vendas de Produtos  
**Data de Conclusão:** 2 de fevereiro de 2026  
**Status:** ✅ 100% Completo

---

## 📋 Índice

1. [Verificações de Ambiente](#verificações-de-ambiente)
2. [Configuração do Projeto](#configuração-do-projeto)
3. [Banco de Dados PostgreSQL](#banco-de-dados-postgresql)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Estrutura de Arquivos Criada](#estrutura-de-arquivos-criada)
6. [Credenciais e Acesso](#credenciais-e-acesso)
7. [Próximos Passos](#próximos-passos)

---

## ✅ Verificações de Ambiente

### 1.1 Software Instalado e Verificado

| Software | Versão | Status |
|----------|--------|--------|
| **Node.js** | v22.20.0 | ✅ Instalado |
| **npm** | 10.9.3 | ✅ Instalado |
| **Git** | 2.47.0.windows.2 | ✅ Instalado |
| **PostgreSQL** | 18.0 | ✅ Instalado |

### 1.2 Verificação Realizada

```powershell
# Comandos executados para verificação
node --version    # v22.20.0
npm --version     # 10.9.3
git --version     # git version 2.47.0.windows.2
psql --version    # psql (PostgreSQL) 18.0
```

---

## 🗂️ Configuração do Projeto

### 2.1 Repositório Git

**Status:** ✅ Inicializado

```powershell
# Comando executado
cd "C:\Users\Victor\Desktop\K2ON.CASA\Site de Vendas"
git init
```

**Resultado:** Repositório Git criado com sucesso em `.git/`

### 2.2 Arquivo .gitignore Criado

Arquivo configurado para ignorar:
- `node_modules/`
- `.next/`, `build/`, `dist/`, `out/`
- `.env`, `.env.local`, `.env.*.local`
- `.vscode/`, `.idea/`
- `.DS_Store`, `Thumbs.db`
- Arquivos de log e cache

**Localização:** `C:\Users\Victor\Desktop\K2ON.CASA\Site de Vendas\.gitignore`

---

## 🗄️ Banco de Dados PostgreSQL

### 3.1 Banco de Dados Criado

**Nome do Banco:** `point55`  
**Host:** localhost  
**Porta:** 5432  
**Status:** ✅ Criado e operacional

### 3.2 Credenciais de Acesso

```
Usuário: postgres
Senha: 140119
Database: point55
Host: localhost
Porta: 5432
```

**String de Conexão:**
```
postgresql://postgres:140119@localhost:5432/point55
```

### 3.3 Schema do Banco de Dados

#### Tabelas Criadas (14 tabelas)

##### 📦 Tabelas Principais

1. **categorias**
   - `id` (SERIAL PRIMARY KEY)
   - `nome` (VARCHAR 100)
   - `slug` (VARCHAR 100 UNIQUE)
   - `imagem` (TEXT)
   - `ordem` (INTEGER)
   - `ativa` (BOOLEAN)
   - `data_criacao` (TIMESTAMP)
   
   **Dados Inseridos:** 5 categorias padrão
   - Roupas Femininas
   - Roupas Masculinas
   - Acessórios
   - Calçados
   - Promoções

2. **produtos**
   - `id` (SERIAL PRIMARY KEY)
   - `nome` (VARCHAR 255)
   - `descricao` (TEXT)
   - `preco` (DECIMAL 10,2)
   - `preco_original` (DECIMAL 10,2)
   - `desconto_percentual` (INTEGER)
   - `categoria_id` (FK → categorias)
   - `estoque` (INTEGER)
   - `imagens` (TEXT[]) - Array de URLs
   - `cores_disponiveis` (TEXT[])
   - `tamanhos_disponiveis` (TEXT[])
   - `ativo` (BOOLEAN)
   - `vendas_total` (INTEGER)
   - `data_criacao`, `data_atualizacao` (TIMESTAMP)

3. **usuarios**
   - `id` (SERIAL PRIMARY KEY)
   - `nome` (VARCHAR 255)
   - `email` (VARCHAR 255 UNIQUE)
   - `senha_hash` (VARCHAR 255)
   - `telefone` (VARCHAR 20)
   - `cpf` (VARCHAR 14 UNIQUE)
   - `data_nascimento` (DATE)
   - `data_cadastro` (TIMESTAMP)
   - `ativo` (BOOLEAN)
   - `is_admin` (BOOLEAN)

4. **enderecos**
   - `id` (SERIAL PRIMARY KEY)
   - `usuario_id` (FK → usuarios)
   - `cep`, `rua`, `numero`, `complemento`
   - `bairro`, `cidade`, `estado`
   - `is_principal` (BOOLEAN)
   - `data_criacao` (TIMESTAMP)

5. **pedidos**
   - `id` (SERIAL PRIMARY KEY)
   - `usuario_id` (FK → usuarios)
   - `status` (VARCHAR 50) - pendente, pago, processando, enviado, entregue, cancelado
   - `subtotal`, `desconto`, `frete`, `total` (DECIMAL)
   - `forma_pagamento` (VARCHAR 50) - cartao, pix, boleto
   - `codigo_rastreio` (VARCHAR 100)
   - `endereco_entrega_id` (FK → enderecos)
   - `data_pedido`, `data_atualizacao` (TIMESTAMP)

6. **itens_pedido**
   - `id` (SERIAL PRIMARY KEY)
   - `pedido_id` (FK → pedidos)
   - `produto_id` (FK → produtos)
   - `quantidade` (INTEGER)
   - `preco_unitario`, `subtotal` (DECIMAL)
   - `tamanho`, `cor` (VARCHAR)

##### ⭐ Tabelas de Avaliação

7. **avaliacoes**
   - `id` (SERIAL PRIMARY KEY)
   - `produto_id` (FK → produtos)
   - `usuario_id` (FK → usuarios)
   - `nota` (INTEGER 1-5)
   - `data_avaliacao` (TIMESTAMP)
   - `verificado_compra` (BOOLEAN)
   - `ativo` (BOOLEAN)

8. **comentarios**
   - `id` (SERIAL PRIMARY KEY)
   - `produto_id` (FK → produtos)
   - `usuario_id` (FK → usuarios)
   - `texto` (TEXT)
   - `data_comentario` (TIMESTAMP)
   - `curtidas` (INTEGER)
   - `verificado_compra` (BOOLEAN)
   - `ativo` (BOOLEAN)

##### 🎯 Tabelas de Marketing

9. **promocoes**
   - `id` (SERIAL PRIMARY KEY)
   - `nome`, `descricao` (VARCHAR/TEXT)
   - `tipo_desconto` (VARCHAR 20) - percentual, valor_fixo
   - `desconto_percentual` (INTEGER)
   - `desconto_valor` (DECIMAL)
   - `data_inicio`, `data_fim` (TIMESTAMP)
   - `ativa` (BOOLEAN)
   - `produtos_aplicaveis` (INTEGER[])

10. **badges** (Selos: Best Seller, Mais Vendido, etc)
    - `id` (SERIAL PRIMARY KEY)
    - `nome` (VARCHAR 100)
    - `tipo` (VARCHAR 50) - best_seller, mais_vendido, novo, limitado
    - `cor` (VARCHAR 20)
    - `icone` (VARCHAR 100)
    
    **Dados Inseridos:** 4 badges padrão
    - Best Seller (#FF6B6B)
    - Mais Vendido (#4ECDC4)
    - Novo (#95E1D3)
    - Edição Limitada (#F38181)

11. **produtos_badges** (Relacionamento N:N)
    - `produto_id` (FK → produtos)
    - `badge_id` (FK → badges)
    - PRIMARY KEY (produto_id, badge_id)

12. **cupons**
    - `id` (SERIAL PRIMARY KEY)
    - `codigo` (VARCHAR 50 UNIQUE)
    - `tipo_desconto` (VARCHAR 20)
    - `valor_desconto` (DECIMAL)
    - `valor_minimo_pedido` (DECIMAL)
    - `data_validade` (TIMESTAMP)
    - `ativo` (BOOLEAN)
    - `usos_maximos`, `usos_atuais` (INTEGER)

13. **newsletter**
    - `id` (SERIAL PRIMARY KEY)
    - `email` (VARCHAR 255 UNIQUE)
    - `data_inscricao` (TIMESTAMP)
    - `ativo` (BOOLEAN)

14. **carrinho** (Persistência opcional)
    - `id` (SERIAL PRIMARY KEY)
    - `usuario_id` (FK → usuarios)
    - `produto_id` (FK → produtos)
    - `quantidade` (INTEGER)
    - `tamanho`, `cor` (VARCHAR)
    - `data_adicao` (TIMESTAMP)

#### Índices Criados (9 índices)

```sql
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_avaliacoes_produto ON avaliacoes(produto_id);
CREATE INDEX idx_comentarios_produto ON comentarios(produto_id);
CREATE INDEX idx_promocoes_ativa ON promocoes(ativa);
CREATE INDEX idx_cupons_codigo ON cupons(codigo);
CREATE INDEX idx_usuarios_email ON usuarios(email);
```

#### Triggers Automáticos

**Função Criada:**
```sql
CREATE OR REPLACE FUNCTION update_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Triggers Aplicados:**
- `trigger_update_produtos` - Atualiza automaticamente `data_atualizacao` em produtos
- `trigger_update_pedidos` - Atualiza automaticamente `data_atualizacao` em pedidos

### 3.4 Scripts Criados

#### Script de Criação do Banco

**Arquivo:** `database/create-database.ps1`

Funcionalidades:
- Solicita credenciais do PostgreSQL
- Verifica se o banco já existe
- Oferece opção de recriar o banco
- Executa o schema.sql automaticamente
- Exibe informações de conexão ao final

**Como usar:**
```powershell
cd "C:\Users\Victor\Desktop\K2ON.CASA\Site de Vendas\database"
.\create-database.ps1
```

#### Schema SQL Completo

**Arquivo:** `database/schema.sql`

Contém:
- Definição de todas as 14 tabelas
- Criação de 9 índices
- Inserção de dados padrão (5 categorias, 4 badges)
- Definição de função e triggers
- Relacionamentos e constraints

---

## 🔐 Variáveis de Ambiente

### 4.1 Arquivo .env.local (Desenvolvimento)

**Localização:** `C:\Users\Victor\Desktop\K2ON.CASA\Site de Vendas\.env.local`

```env
# Configurações do Banco de Dados
DATABASE_URL=postgresql://postgres:140119@localhost:5432/point55
DB_HOST=localhost
DB_PORT=5432
DB_NAME=point55
DB_USER=postgres
DB_PASSWORD=140119

# Autenticação JWT
JWT_SECRET=point55_secret_key_development_2026
JWT_REFRESH_SECRET=point55_refresh_secret_key_development_2026
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# API Configuration
API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Ambiente
NODE_ENV=development

# Segurança
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.2 Arquivo .env.example (Template)

**Localização:** `C:\Users\Victor\Desktop\K2ON.CASA\Site de Vendas\.env.example`

Contém template completo com:
- Configurações de banco de dados
- JWT secrets
- Gateway de pagamento (Mercado Pago, Stripe)
- Configuração de email
- WhatsApp Business API
- Upload de imagens (Cloudinary)
- Analytics e monitoramento

**⚠️ Importante:** O arquivo `.env.local` está no `.gitignore` e não será commitado

---

## 📁 Estrutura de Arquivos Criada

```
Site de Vendas/
│
├── .git/                           # Repositório Git
├── .gitignore                      # Arquivos ignorados
│
├── database/
│   ├── schema.sql                  # Schema completo do banco
│   └── create-database.ps1         # Script de criação
│
├── docs/
│   └── etapa-1-configuracao-ambiente.md  # Este documento
│
├── .env.local                      # Variáveis de ambiente (desenvolvimento)
├── .env.example                    # Template de variáveis
├── read-me.md                      # Especificações do projeto
└── README.md                       # Documentação geral
```

---

## 🔑 Credenciais e Acesso

### PostgreSQL

```
Host: localhost
Porta: 5432
Database: point55
Usuário: postgres
Senha: 140119

String de Conexão:
postgresql://postgres:140119@localhost:5432/point55
```

### Acesso via psql

```powershell
# Conectar ao banco
psql -U postgres -d point55

# Comandos úteis
\dt              # Listar tabelas
\d nome_tabela   # Descrever estrutura da tabela
\l               # Listar todos os bancos
\q               # Sair
```

### Acesso via pgAdmin

1. Abrir pgAdmin
2. Criar nova conexão:
   - Name: Point55
   - Host: localhost
   - Port: 5432
   - Database: point55
   - Username: postgres
   - Password: 140119

---

## ✅ Checklist da Etapa 1

- [x] **1.1** Preparar Ambiente de Desenvolvimento
  - [x] Verificar Node.js instalado (v22.20.0)
  - [x] Verificar npm instalado (10.9.3)
  - [x] Verificar Git instalado (2.47.0)
  - [x] Editor de código disponível (VS Code)

- [x] **1.2** Configurar o Projeto
  - [x] Criar pasta do projeto
  - [x] Inicializar repositório Git
  - [x] Criar arquivo .gitignore

- [x] **1.3** Instalar PostgreSQL
  - [x] Verificar PostgreSQL instalado (18.0)
  - [x] Configurar usuário e senha
  - [x] Ferramenta de gerenciamento disponível

- [x] **1.4** Criar Banco de Dados
  - [x] Criar banco 'point55'
  - [x] Definir schema completo (14 tabelas)
  - [x] Criar índices (9 índices)
  - [x] Inserir dados padrão (5 categorias, 4 badges)
  - [x] Criar triggers automáticos (2 triggers)

- [x] **1.5** Configurar Variáveis de Ambiente
  - [x] Criar .env.local com configurações
  - [x] Criar .env.example como template
  - [x] Adicionar .env.local ao .gitignore
  - [x] Documentar todas as variáveis

---

## 🎯 Próximos Passos - Etapa 2

### Frontend com Next.js

**O que será feito:**

1. **Inicializar Projeto Next.js**
   - Criar projeto com TypeScript
   - Configurar estrutura de pastas

2. **Instalar Dependências**
   - Bootstrap 5
   - React Icons
   - Axios
   - Redux ou Context API

3. **Criar Componentes**
   - Header (logo, menu, carrinho, busca)
   - Footer (newsletter, links, selos)
   - ProductCard (com badges, preços, contador)
   - ProductGrid (grid responsivo)
   - HeroSlider (banner principal)
   - ReviewCarousel (avaliações)
   - E mais 15+ componentes

4. **Desenvolver Páginas**
   - Home (index)
   - Catálogo de Produtos
   - Detalhes do Produto
   - Carrinho de Compras
   - Checkout
   - Perfil do Usuário
   - Histórico de Pedidos

5. **Implementar Design**
   - Paleta de cores (Branco, Preto, Azul)
   - Tipografia sans-serif
   - Layout responsivo (mobile-first)
   - Animações e transições

**Comando para iniciar:**
```powershell
cd "C:\Users\Victor\Desktop\K2ON.CASA\Site de Vendas"
npx create-next-app@latest frontend
```

---

## 📊 Estatísticas da Etapa 1

| Item | Quantidade |
|------|------------|
| Tabelas criadas | 14 |
| Índices criados | 9 |
| Triggers criados | 2 |
| Categorias inseridas | 5 |
| Badges inseridos | 4 |
| Arquivos criados | 7 |
| Linhas de SQL | ~250 |
| Scripts PowerShell | 1 |

---

## 📝 Notas Importantes

1. **Segurança**
   - Senha do banco documentada: 140119
   - Arquivo .env.local não será commitado (está no .gitignore)
   - JWT secrets gerados para desenvolvimento
   - Em produção, usar senhas mais fortes e secrets diferentes

2. **Backup**
   - Criar backups regulares do banco de dados
   - Comando de backup: `pg_dump -U postgres point55 > backup.sql`
   - Comando de restore: `psql -U postgres point55 < backup.sql`

3. **Performance**
   - 9 índices criados para otimização de queries
   - Triggers automáticos para timestamps
   - Arrays PostgreSQL para imagens e variações

4. **Escalabilidade**
   - Schema preparado para crescimento
   - Relacionamentos bem definidos
   - Separação clara entre dados de produto e vendas

---

## 🎓 Conceitos Aplicados

- **Git**: Controle de versão
- **PostgreSQL**: Banco relacional com features avançadas (arrays, triggers)
- **Normalização**: Separação de dados em tabelas relacionadas
- **Indexação**: Otimização de queries
- **Environment Variables**: Configuração segura
- **PowerShell**: Automação de tarefas

---

## 📞 Suporte

Para dúvidas sobre esta etapa:
1. Consultar este documento
2. Verificar arquivo `read-me.md` com especificações completas
3. Consultar `README.md` do projeto
4. Revisar scripts em `database/`

---

**Documento criado em:** 2 de fevereiro de 2026  
**Versão:** 1.0  
**Projeto:** Point55 - Site de Vendas  
**Etapa:** 1 - Configuração do Ambiente ✅ CONCLUÍDA
