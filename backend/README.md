# Backend Point55 - API REST

API REST para o e-commerce Point55, desenvolvida com Node.js, Express e PostgreSQL.

## 🚀 Tecnologias

- **Node.js** v22.20.0
- **Express** 5.2.1 - Framework web
- **PostgreSQL** 18.0 - Banco de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **dotenv** - Variáveis de ambiente
- **cors** - Cross-Origin Resource Sharing
- **express-validator** - Validação de dados

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais
```

## ⚙️ Configuração

Edite o arquivo `.env` com suas configurações:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=point55
DB_USER=postgres
DB_PASSWORD=sua_senha

JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=24h

FRONTEND_URL=http://localhost:3000
```

## 🎯 Executar

```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

O servidor estará disponível em: `http://localhost:5000`

## 📁 Estrutura do Projeto

```
backend/
├── config/
│   └── database.js          # Configuração PostgreSQL
├── controllers/
│   ├── categoriaController.js
│   └── produtoController.js
├── middlewares/
│   └── (a implementar)
├── routes/
│   ├── categorias.js
│   └── produtos.js
├── services/
│   └── (a implementar)
├── utils/
│   └── (a implementar)
├── .env                     # Variáveis de ambiente
├── .env.example             # Template de variáveis
├── .gitignore
├── server.js                # Arquivo principal
├── package.json
└── API-TESTES.md           # Documentação de testes
```

## 🛣️ Rotas Implementadas

### Health Check
- `GET /` - Status da API
- `GET /health` - Health check

### Categorias
- `GET /api/categorias` - Listar categorias
- `GET /api/categorias/:id` - Obter categoria
- `GET /api/categorias/:id/produtos` - Produtos por categoria
- `POST /api/categorias` - Criar categoria (admin)
- `PUT /api/categorias/:id` - Atualizar categoria (admin)
- `DELETE /api/categorias/:id` - Deletar categoria (admin)

### Produtos
- `GET /api/produtos` - Listar produtos (com filtros)
- `GET /api/produtos/:id` - Obter produto
- `GET /api/produtos/promocoes` - Produtos em promoção
- `GET /api/produtos/destaques` - Produtos em destaque
- `POST /api/produtos` - Criar produto (admin)
- `PUT /api/produtos/:id` - Atualizar produto (admin)
- `PATCH /api/produtos/:id/estoque` - Atualizar estoque (admin)
- `DELETE /api/produtos/:id` - Deletar produto (admin)

## 🔍 Filtros e Parâmetros

### Produtos
```
GET /api/produtos?categoria=1&busca=camisa&promocao=true&precoMin=50&precoMax=200&ordem=preco&direcao=ASC&limite=20&pagina=1
```

**Parâmetros:**
- `categoria` - ID da categoria
- `busca` - Termo de busca (nome/descrição)
- `precoMin` / `precoMax` - Faixa de preço
- `promocao` - true/false (produtos em promoção)
- `ordem` - data_criacao|preco|nome|vendas
- `direcao` - ASC|DESC
- `limite` - Itens por página (padrão: 20)
- `pagina` - Número da página (padrão: 1)

## 📊 Banco de Dados

### Tabelas Utilizadas
- `categorias` - Categorias de produtos
- `produtos` - Produtos da loja
- `usuarios` - Usuários do sistema
- `pedidos` - Pedidos realizados
- `itens_pedido` - Itens de cada pedido
- `avaliacoes` - Avaliações de produtos
- `comentarios` - Comentários de produtos
- `promocoes` - Promoções ativas
- `cupons` - Cupons de desconto
- `enderecos` - Endereços de entrega
- `newsletter` - Assinantes da newsletter
- `badges` - Badges de produtos
- `produto_badges` - Relacionamento produto-badge
- `imagens_produtos` - Imagens de produtos

## 🧪 Testando a API

Consulte o arquivo [API-TESTES.md](./API-TESTES.md) para exemplos de requisições.

## 💾 Backup e Restore do Banco

Consulte [BACKUP-BANCO.md](./BACKUP-BANCO.md) para configuração de backup automático, backup manual e restauração.

### Exemplo com PowerShell
```powershell
# Listar categorias
Invoke-RestMethod -Uri "http://localhost:5000/api/categorias" -Method Get | ConvertTo-Json

# Buscar produtos
Invoke-RestMethod -Uri "http://localhost:5000/api/produtos?busca=camisa" -Method Get | ConvertTo-Json
```

## 🔒 Segurança (Em Implementação)

- [ ] Autenticação JWT
- [ ] Middleware de autorização
- [ ] Proteção de rotas administrativas
- [ ] Rate limiting
- [ ] Validação de dados
- [ ] Sanitização de inputs
- [ ] HTTPS (produção)

## 📈 Próximos Passos

1. ✅ Configurar servidor Express
2. ✅ Conectar com PostgreSQL
3. ✅ Implementar rotas de Categorias
4. ✅ Implementar rotas de Produtos
5. ⏳ Implementar autenticação JWT
6. ⏳ Criar middleware de autorização
7. ⏳ Implementar rotas de Usuários
8. ⏳ Implementar rotas de Pedidos
9. ⏳ Implementar sistema de Avaliações
10. ⏳ Implementar Promoções e Cupons
11. ⏳ Integrar Gateway de Pagamento

## 👨‍💻 Desenvolvimento

```bash
# Instalar nodemon para desenvolvimento
npm install --save-dev nodemon

# Executar em modo de desenvolvimento
npm run dev
```

## 📝 Notas

- Rotas administrativas ainda não possuem autenticação (será implementado)
- Deletar produto realiza soft delete (apenas desativa)
- Todas as respostas seguem o padrão: `{ success, data/error, ... }`

## 🐛 Debug

Logs são exibidos no console durante o desenvolvimento:
- Queries executadas
- Erros de conexão
- Requisições recebidas

---

**Desenvolvido por:** Victor Silva  
**Data:** Fevereiro de 2026  
**Versão:** 1.0.0
