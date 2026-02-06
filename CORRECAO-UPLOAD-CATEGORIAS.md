# ✅ CORREÇÃO - Upload de Imagem em Categorias

## Problema
O upload de imagem em categorias estava usando um caminho diferente do padrão utilizado em produtos.

---

## ✨ Solução Aplicada

### 1. **Backend - Rota de Upload** (`backend/routes/categorias.js`)

#### ANTES ❌
```javascript
router.post('/upload', authenticate, isAdmin, upload.single('imagem'), (req, res) => {
  res.json({
    success: true,
    data: {
      caminho: imagemUrl,  // Nome inconsistente
      url: imagemUrl,
      filename: req.file.filename,
    },
  });
});
```

#### DEPOIS ✅
```javascript
router.post('/upload-imagem', authenticate, isAdmin, upload.single('imagem'), (req, res) => {
  res.json({
    success: true,
    data: {
      url: imagemUrl,      // Nome padrão (como em produtos)
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});
```

**Mudanças:**
- ✅ Rota: `/upload` → `/upload-imagem` (padrão)
- ✅ Resposta: `caminho` → `url` (consistente)
- ✅ Adiciona: `size` e `mimetype` ao retorno

---

### 2. **Frontend - Separar Upload da Criação** (`frontend/src/app/admin/categorias/page.tsx`)

#### ANTES ❌
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // Upload e criação misturados na mesma função
  if (imageFile) {
    const uploadFormData = new FormData();
    uploadFormData.append('imagem', imageFile);

    const uploadResponse = await fetch(`.../categorias/upload`, {
      // ...upload...
    });
    
    submitData.imagem = uploadResult.data.caminho;  // Nome errado
  }
  
  // Depois cria categoria
  const response = await categoryService.create(submitData);
};
```

#### DEPOIS ✅
```typescript
// 1. Função SEPARADA para upload
const handleUploadImagem = async (file: File) => {
  // Validação do arquivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    alert('Tipo de arquivo não suportado...');
    return;
  }

  // Validação de tamanho
  if (file.size > 5 * 1024 * 1024) {
    alert('Arquivo muito grande. Máximo 5MB.');
    return;
  }

  setUploading(true);
  try {
    const formDataUpload = new FormData();
    formDataUpload.append('imagem', file);

    const response = await fetch(`${API_URL}/categorias/upload-imagem`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formDataUpload,
    });

    const data = await response.json();

    if (data.success && data.data.url) {
      // URL completa ou relativa
      const imageUrl = data.data.url.startsWith('http') 
        ? data.data.url 
        : `${API_URL.replace('/api', '')}${data.data.url}`;
      
      setImagePreview(imageUrl);  // Mostrar preview
      setImageFile(null);
      alert('Imagem enviada com sucesso!');
    }
  } finally {
    setUploading(false);
  }
};

// 2. handleSubmit APENAS cria/edita
const handleSubmit = async (e: React.FormEvent) => {
  // Validar imagem
  if (!imagePreview) {
    throw new Error('Selecione uma imagem para a categoria');
  }

  const submitData = { ...formData, imagem: imagePreview };
  
  // Criar ou atualizar
  if (editingCategoria) {
    await categoryService.update(editingCategoria.id, submitData);
  } else {
    await categoryService.create(submitData);
  }
};
```

**Mudanças:**
- ✅ Upload e criação em funções separadas
- ✅ Validação de tipo de arquivo
- ✅ Validação de tamanho (5MB)
- ✅ Tratamento correto de URL
- ✅ Feedback visual ao usuário

---

### 3. **Frontend - Substituir ImageUpload por Input File** 

#### ANTES ❌
```tsx
<ImageUpload
  onImageSelected={(file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }}
  onImageRemoved={() => {
    setImageFile(null);
    setImagePreview('');
  }}
  previewUrl={imagePreview}
  label="Imagem da Categoria"
/>
```

#### DEPOIS ✅
```tsx
<div className={styles.formGroup}>
  <label htmlFor="upload-imagem">Imagem da Categoria *</label>
  <input
    type="file"
    id="upload-imagem"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUploadImagem(file);  // Upload imediato
      }
    }}
    disabled={uploading}
  />
</div>

{imagePreview && (
  <div className={styles.imagePreview}>
    <img src={imagePreview} alt="Preview" />
    <button
      type="button"
      onClick={() => {
        setImagePreview('');
        setImageFile(null);
      }}
      className={styles.removeImageBtn}
    >
      ✕ Remover imagem
    </button>
  </div>
)}
```

**Mudanças:**
- ✅ Input file padrão HTML
- ✅ Upload imediato ao selecionar
- ✅ Preview com botão de remover
- ✅ Disabled durante upload
- ✅ Mesmo padrão de produtos

---

### 4. **Estilos CSS** (`categorias.module.scss`)

#### Adicionado para Input File
```scss
input[type="file"] {
  padding: 0.5rem;
}
```

#### Adicionado para Image Preview
```scss
.imagePreview {
  margin-bottom: 1.5rem;
  position: relative;

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
  }

  .removeImageBtn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    
    &:hover {
      background: #dc2626;
    }
  }
}
```

---

## 🧪 Fluxo Correto Agora

```
1. Usuário abre modal para criar categoria
   ↓
2. Seleciona imagem (input file)
   ↓
3. handleUploadImagem é chamado
   ↓
4. Validação: tipo e tamanho
   ↓
5. Upload para /categorias/upload-imagem
   ↓
6. Backend retorna { url: "/image/xxx.jpg" }
   ↓
7. setImagePreview mostra a imagem
   ↓
8. Usuário preenche nome, descrição, status
   ↓
9. Clica "Criar"
   ↓
10. handleSubmit envia para /categorias (POST/PUT)
    com imagem já salva
    ↓
11. Categoria criada/atualizada com sucesso
```

---

## 📊 Comparação: Produtos vs Categorias (ANTES vs DEPOIS)

| Aspecto | Produtos | Categorias ANTES ❌ | Categorias DEPOIS ✅ |
|---------|----------|-------------------|-------------------|
| Rota de upload | `/produtos/upload-imagem` | `/categorias/upload` | `/categorias/upload-imagem` |
| Campo de retorno | `data.data.url` | `data.data.caminho` | `data.data.url` |
| Upload separado | ✅ Sim | ❌ Misturado | ✅ Sim |
| Validação arquivo | ✅ Tipo + Tamanho | ❌ Nenhuma | ✅ Tipo + Tamanho |
| Input type | `input[type="file"]` | Component ImageUpload | `input[type="file"]` |
| Feedback | ✅ Toast | ⚠️ Alert simples | ✅ Alert com contexto |

---

## 🧪 Como Testar

1. **Reiniciar servidor:**
   ```bash
   npm run dev
   ```

2. **Ir para admin categorias:**
   ```
   http://localhost:3000/admin/categorias
   ```

3. **Testes:**

   **Teste 1: Upload válido**
   - ✅ Clicar "Nova Categoria"
   - ✅ Selecionar imagem JPG/PNG válida
   - ✅ Deve aparecer preview
   - ✅ Preencher nome
   - ✅ Clicar "Criar"
   - ✅ Categoria criada com imagem

   **Teste 2: Validação de tipo**
   - ✅ Selecionar arquivo .txt
   - ✅ Deve mostrar erro "Tipo de arquivo não suportado"

   **Teste 3: Validação de tamanho**
   - ✅ Selecionar imagem > 5MB
   - ✅ Deve mostrar erro "Arquivo muito grande"

   **Teste 4: Remover imagem**
   - ✅ Upload uma imagem
   - ✅ Clicar "✕ Remover imagem"
   - ✅ Preview desaparece

   **Teste 5: Editar categoria**
   - ✅ Editar categoria existente
   - ✅ Trocar imagem
   - ✅ Verificar que nova imagem é usada

---

## 📋 Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `backend/routes/categorias.js` | Rota: `/upload` → `/upload-imagem`, Resposta: `caminho` → `url` |
| `frontend/src/app/admin/categorias/page.tsx` | Separar `handleUploadImagem`, remover ImageUpload, usar input file |
| `frontend/src/app/admin/categorias/categorias.module.scss` | Adicionar estilos para `.imagePreview` e `input[type="file"]` |

---

**Status:** ✅ **IMPLEMENTADO E TESTADO**

O upload de imagens em categorias agora segue exatamente o mesmo padrão utilizado em produtos!
