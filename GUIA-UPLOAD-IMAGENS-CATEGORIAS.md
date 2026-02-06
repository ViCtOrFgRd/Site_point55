# ✅ Verificação - Upload de Imagens de Categorias

## Status: IMPLEMENTADO E FUNCIONAL

### 📍 Frontend - Onde Acessar

**Local:** `Admin > Gerenciar Categorias`

1. Na barra de navegação superior, clique em **Admin**
2. Na página do painel, procure por **Categorias** no menu lateral
3. Clique em **"Nova Categoria"** ou clique no ícone ✏️ **Editar** em uma categoria existente

### 📋 O que você verá no Formulário

Quando abrir o modal de criar/editar categoria, você verá na ordem:

```
┌─────────────────────────────────────┐
│  Imagem da Categoria                │
│  ┌──────────────────────────────┐   │
│  │ [Arraste ou clique aqui]     │   │
│  │ Máximo 5MB • JPG, PNG, WebP  │   │
│  └──────────────────────────────┘   │
├─────────────────────────────────────┤
│  Nome *                             │
│  [Ex: Camisetas]                    │
├─────────────────────────────────────┤
│  Descrição                          │
│  [Descrição da categoria...]        │
├─────────────────────────────────────┤
│  ☐ Categoria ativa                  │
├─────────────────────────────────────┤
│  [Cancelar]  [Criar]                │
└─────────────────────────────────────┘
```

### 🎯 Como Usar

1. **Selecionar Imagem:**
   - Arraste a imagem diretamente na área ou clique para selecionar
   - Formatos aceitos: JPG, PNG, WebP
   - Tamanho máximo: 5MB

2. **Preencher Dados:**
   - Nome: Ex: "Camisetas", "Calças", etc
   - Descrição: Opcional, descreva a categoria
   - Ativo: Marque para deixar a categoria ativa

3. **Salvar:**
   - Clique em "Criar" para nova categoria
   - Clique em "Atualizar" para editar categoria existente

### 📸 Preview da Imagem

Após selecionar a imagem, você verá um preview com:
- Miniatura da imagem
- Botão X para remover (se quiser trocar)

### ✨ Na Home do Site

Depois que você salvar a categoria com a imagem:
- A imagem aparecerá na seção **"Categorias"** da home
- Se não houver imagem, aparecerá uma imagem padrão (SVG com emoji)

### 🔌 Verificação do Backend

**Rota de Upload:** `POST /api/categorias/upload`
- **Autenticação:** Sim (requer token JWT)
- **Permissão:** Admin apenas
- **Response:**
  ```json
  {
    "success": true,
    "message": "Imagem enviada com sucesso",
    "data": {
      "caminho": "/image/categoria-12345.jpg",
      "url": "/image/categoria-12345.jpg",
      "filename": "categoria-12345.jpg"
    }
  }
  ```

**Banco de Dados:**
- Tabela: `categorias`
- Coluna: `imagem` (TEXT)
- Armazena o caminho da imagem: `/image/categoria-nome.jpg`

### 🧪 Teste Rápido

1. Vá para **Admin > Categorias**
2. Clique em **"Nova Categoria"**
3. Arraste uma imagem na área de upload
4. Preencha o nome: "Teste Imagens"
5. Clique em **"Criar"**
6. Volte para a **Home** e veja a categoria com a imagem!

### ⚠️ Possíveis Problemas

| Problema | Solução |
|----------|---------|
| Upload falha | Verifique: tamanho < 5MB, formato válido (JPG/PNG) |
| Imagem não aparece | Atualize a página ou limpe o cache (Ctrl+Shift+Del) |
| Erro de autenticação | Faça login novamente no painel admin |
| Modal não abre | Verifique permissões de admin (is_admin = true) |

### 📁 Estrutura de Arquivos

```
Frontend:
├── src/app/admin/categorias/page.tsx (painel admin)
├── src/components/ImageUpload/ImageUpload.tsx (componente upload)
└── src/components/ImageUpload/ImageUpload.module.scss (estilos)

Backend:
├── routes/categorias.js (rota /upload)
├── controllers/categoriaController.js (lógica)
└── middlewares/upload.js (processamento de arquivo)

Banco de Dados:
└── categorias.imagem (coluna para armazenar caminho)
```

---

✅ **Tudo pronto para uso!** O painel está visível e funcional para admins.
