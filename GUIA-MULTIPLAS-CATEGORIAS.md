# Guia de Implementação: Múltiplas Categorias por Produto

## 📋 Resumo das Mudanças

Sistema refatorado para permitir que cada produto tenha **múltiplas categorias**. Exemplo: Um relógio pode ser "Masculino", "Feminino" E "Acessórios" ao mesmo tempo.

---

## 🔧 Passo 1: Executar Migração do Banco de Dados

Execute o script de migração em seu banco PostgreSQL:

```sql
-- Arquivo: database/migracao-multiplas-categorias.sql
-- Crie a tabela de junção produto_categorias
-- Migre dados existentes
-- Crie view auxiliar para compatibilidade
```

**Comandos para executar:**

```bash
# Via psql
psql -U seu_usuario -d seu_banco < database/migracao-multiplas-categorias.sql

# Ou copie o conteúdo do arquivo e execute no seu cliente SQL
```

---

## ✅ Passo 2: Arquivos Backend Já Atualizados

Os seguintes arquivos **já foram modificados**:

### ✅ `backend/controllers/produtoController.js`

**Funções Atualizadas:**

1. **listarProdutos()**
   - Agora usa LEFT JOIN com `produto_categorias`
   - Retorna `categoria_ids`, `categoria_nomes`, `categoria_slugs` (arrays)
   - Filtro por categoria usa EXISTS para compatibilidade

2. **obterProduto()**
   - Retorna múltiplas categorias com arrays agregados
   - GROUP BY obrigatório para agregação

3. **criarProduto()**
   - Aceita `categoria_ids` (array) ou `categoria_id` (único)
   - Insere automaticamente registros em `produto_categorias`

4. **atualizarProduto()**
   - Aceita `categoria_ids` para atualizar categorias
   - Remove categorias antigas e adiciona novas

---

## 🎨 Passo 3: Atualizar Frontend

### Componente: `frontend/src/app/admin/produtos/[id]/page.tsx`

**Adicionar campo para múltiplas categorias:**

```tsx
// No estado do formulário
const [formData, setFormData] = useState({
  // ... outros campos ...
  categoria_ids: [] as string[], // Novo: array de IDs
});

// No formulário, adicionar seleção múltipla:
<div className={styles.formGroup}>
  <label>Categorias (Selecione uma ou mais) *</label>
  <div className={styles.checkboxGroup}>
    {categorias.map((cat) => (
      <label key={cat.id}>
        <input 
          type="checkbox" 
          value={cat.id.toString()}
          checked={formData.categoria_ids.includes(cat.id.toString())}
          onChange={(e) => {
            const value = e.target.value;
            setFormData({
              ...formData,
              categoria_ids: e.target.checked
                ? [...formData.categoria_ids, value]
                : formData.categoria_ids.filter(id => id !== value)
            });
          }}
        />
        {cat.nome}
      </label>
    ))}
  </div>
  <small>Um produto pode pertencer a múltiplas categorias</small>
</div>
```

### Componente: `frontend/src/components/ProductCard/ProductCard.tsx`

**Atualizar exibição de categorias:**

```tsx
// Antes: (single category)
<p className={styles.category}>{produto.categoria_nome}</p>

// Depois: (multiple categories)
<div className={styles.categories}>
  {produto.categoria_nomes && produto.categoria_nomes.map((cat, idx) => (
    <span key={idx} className={styles.categoryBadge}>{cat}</span>
  ))}
</div>
```

### Componente: `frontend/src/app/produtos/page.tsx`

**Já atualizado para aceitar slugs!** Nenhuma mudança necessária.

---

## 📊 Exemplo de Dados Retornados

**Antes:**
```json
{
  "id": 1,
  "nome": "Relógio",
  "categoria_id": 2,
  "categoria_nome": "Acessórios"
}
```

**Depois:**
```json
{
  "id": 1,
  "nome": "Relógio",
  "categoria_id": 2,
  "categoria_ids": [1, 2, 3],
  "categoria_nomes": ["Masculino", "Feminino", "Acessórios"],
  "categoria_slugs": ["masculino", "feminino", "acessorios"]
}
```

---

## 🧪 Teste Rápido

### 1. Criar Produto com Múltiplas Categorias

```bash
curl -X POST http://localhost:5000/api/produtos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Relógio Unissex",
    "preco": 150.00,
    "categoria_ids": [1, 2, 3],
    "estoque": 10
  }'
```

### 2. Buscar Produto e Ver Categorias

```bash
curl http://localhost:5000/api/produtos/1
```

### 3. Filtrar por Categoria (ainda funciona)

```bash
curl "http://localhost:5000/api/produtos?categoria=masculino"
curl "http://localhost:5000/api/produtos?categoria=1"
```

---

## ⚠️ Nota Importante: Compatibilidade

- ✅ Campo `categoria_id` mantido para compatibilidade
- ✅ Filtros antigos (por ID ou slug) continuam funcionando
- ✅ Código legado não será quebrado
- ✅ Migração é não-destrutiva (dados preservados)

---

## 📝 Checklist de Implementação

- [ ] Executar migração do banco de dados
- [ ] Atualizar componente de formulário de produto (admin)
- [ ] Atualizar exibição de categorias no ProductCard
- [ ] Testar criação de produto com múltiplas categorias
- [ ] Testar atualização de produto com múltiplas categorias
- [ ] Testar filtros (ainda devem funcionar)
- [ ] Atualizar UI para mostrar múltiplas categorias visualmente

---

## 🐛 Troubleshooting

**Erro: "relation produto_categorias does not exist"**
- Solução: Certifique-se de executar a migração SQL primeiro

**Produtos não aparecem ao filtrar por categoria**
- Solução: Verifique se as categorias foram adicionadas à tabela `produto_categorias`

**Produtos mostram categorias vazias**
- Solução: Execute o comando de migração para migrar dados antigos

