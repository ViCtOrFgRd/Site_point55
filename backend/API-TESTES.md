# Testes da API Point55

## URL Base
```
http://localhost:5000
```

## Rotas Implementadas

### Health Check
```http
GET /
GET /health
```

### Categorias

#### Listar todas as categorias
```http
GET /api/categorias
```

**Resposta esperada:**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

#### Obter categoria específica
```http
GET /api/categorias/:id
```

#### Listar produtos por categoria
```http
GET /api/categorias/:id/produtos
```

**Query params:**
- `limite` - número de produtos por página (padrão: 20)
- `pagina` - número da página (padrão: 1)
- `ordem` - campo de ordenação (padrão: data_criacao DESC)

#### Criar categoria (admin)
```http
POST /api/categorias
Content-Type: application/json

{
  "nome": "Nova Categoria",
  "slug": "nova-categoria",
  "imagem": "url_da_imagem",
  "ordem": 1,
  "ativa": true
}
```

#### Atualizar categoria (admin)
```http
PUT /api/categorias/:id
Content-Type: application/json

{
  "nome": "Categoria Atualizada"
}
```

#### Deletar categoria (admin)
```http
DELETE /api/categorias/:id
```

---

### Produtos

#### Listar produtos
```http
GET /api/produtos
```

**Query params:**
- `categoria` - filtrar por ID da categoria
- `busca` - buscar por nome ou descrição
- `precoMin` - preço mínimo
- `precoMax` - preço máximo
- `promocao` - true/false (apenas produtos em promoção)
- `ordem` - data_criacao|preco|nome|vendas (padrão: data_criacao)
- `direcao` - ASC|DESC (padrão: DESC)
- `limite` - produtos por página (padrão: 20)
- `pagina` - número da página (padrão: 1)

**Exemplo:**
```http
GET /api/produtos?categoria=1&promocao=true&ordem=preco&direcao=ASC&limite=10
```

#### Obter produto específico
```http
GET /api/produtos/:id
```

**Resposta inclui:**
- Dados do produto
- Média de avaliações
- Total de avaliações

#### Listar produtos em promoção
```http
GET /api/produtos/promocoes
```

**Query params:**
- `limite` - produtos por página (padrão: 20)
- `pagina` - número da página (padrão: 1)

#### Listar produtos em destaque
```http
GET /api/produtos/destaques
```

**Query params:**
- `limite` - número de produtos (padrão: 8)

#### Criar produto (admin)
```http
POST /api/produtos
Content-Type: application/json

{
  "nome": "Nome do Produto",
  "descricao": "Descrição detalhada",
  "preco": 99.90,
  "preco_original": 149.90,
  "desconto_percentual": 33,
  "categoria_id": 1,
  "estoque": 50,
  "imagens": ["url1", "url2"],
  "cores_disponiveis": ["Preto", "Branco"],
  "tamanhos_disponiveis": ["P", "M", "G"],
  "ativo": true
}
```

#### Atualizar produto (admin)
```http
PUT /api/produtos/:id
Content-Type: application/json

{
  "preco": 89.90,
  "estoque": 100
}
```

#### Atualizar estoque (admin)
```http
PATCH /api/produtos/:id/estoque
Content-Type: application/json

{
  "estoque": 25
}
```

#### Deletar produto (admin)
```http
DELETE /api/produtos/:id
```
**Nota:** Realiza soft delete (apenas desativa o produto)

---

## Testando com PowerShell

### Listar categorias
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/categorias" -Method Get | ConvertTo-Json
```

### Obter categoria específica
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/categorias/1" -Method Get | ConvertTo-Json
```

### Listar produtos
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/produtos" -Method Get | ConvertTo-Json
```

### Buscar produtos
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/produtos?busca=camisa&limite=5" -Method Get | ConvertTo-Json
```

### Criar produto (exemplo)
```powershell
$body = @{
    nome = "Camiseta Básica"
    descricao = "Camiseta 100% algodão"
    preco = 49.90
    categoria_id = 1
    estoque = 100
    imagens = @("https://exemplo.com/img.jpg")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/produtos" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json
```

---

## Status Atual

✅ **Implementado:**
- Rotas de Categorias (completo)
- Rotas de Produtos (completo)
- Filtros e busca
- Paginação
- Ordenação

⏳ **Pendente:**
- Sistema de autenticação (JWT)
- Middleware de autorização (admin)
- Rotas de Usuários
- Rotas de Pedidos
- Rotas de Avaliações e Comentários
- Rotas de Promoções e Cupons
- Gateway de Pagamento

---

## Próximos Passos

1. Implementar sistema de autenticação (JWT)
2. Criar middleware de autorização
3. Proteger rotas administrativas
4. Implementar rotas de usuários e autenticação
5. Implementar rotas de pedidos
6. Implementar sistema de avaliações
