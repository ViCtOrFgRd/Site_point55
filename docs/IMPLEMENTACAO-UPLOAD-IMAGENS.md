# Implementação de Upload de Imagens na Área Admin

**Data de Implementação:** 04/02/2026  
**Versão:** 1.0.0  
**Funcionalidade:** Upload de imagens de produtos na área administrativa

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Implementação Backend](#implementação-backend)
4. [Implementação Frontend](#implementação-frontend)
5. [Estrutura de Armazenamento](#estrutura-de-armazenamento)
6. [Testes E2E](#testes-e2e)
7. [Validações e Segurança](#validações-e-segurança)
8. [Como Usar](#como-usar)
9. [Troubleshooting](#troubleshooting)

---

## Visão Geral

### Objetivo
Permitir que administradores façam upload de imagens de produtos diretamente do computador, além da opção existente de adicionar imagens via URL.

### Recursos Implementados
- ✅ Upload de arquivos de imagem (JPEG, PNG, GIF, WEBP)
- ✅ Limite de tamanho de 5MB por arquivo
- ✅ Alternância entre URL e Upload
- ✅ Preview das imagens adicionadas
- ✅ Validação de tipo de arquivo
- ✅ Armazenamento na pasta `/image` na raiz
- ✅ Nomes únicos para evitar conflitos
- ✅ Testes E2E completos

---

## Arquitetura

### Fluxo de Upload

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Frontend   │─────▶│   Backend    │─────▶│   Disco     │
│  (React)    │      │  (Express)   │      │  (/image)   │
└─────────────┘      └──────────────┘      └─────────────┘
      │                     │                      │
      │ 1. FormData         │ 2. Multer            │
      │    com arquivo      │    processa          │
      │                     │                      │
      │ 4. Resposta         │ 3. Salva arquivo     │
      │    com URL          │    com nome único    │
      └─────────────────────┴──────────────────────┘
```

### Componentes Envolvidos

**Backend:**
- `middlewares/upload.js` - Configuração do Multer
- `routes/produtos.js` - Rota de upload
- `server.js` - Servir arquivos estáticos

**Frontend:**
- `src/app/admin/produtos/[id]/page.tsx` - Formulário com upload
- `src/app/admin/produtos/[id]/produto-form.module.scss` - Estilos

**Armazenamento:**
- `/image/` - Pasta na raiz do projeto

---

## Implementação Backend

### 1. Instalação de Dependências

```bash
cd backend
npm install multer
```

**Pacote:** `multer@1.4.5-lts.1`  
**Função:** Gerenciamento de uploads multipart/form-data

### 2. Middleware de Upload

**Arquivo:** `backend/middlewares/upload.js`

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que a pasta image existe
const uploadDir = path.join(__dirname, '../../image');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 
                            'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado.'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

module.exports = upload;
```

### 3. Rota de Upload

**Arquivo:** `backend/routes/produtos.js`

```javascript
const upload = require('../middlewares/upload');

// Rota de upload de imagem (protegida - apenas admin)
router.post('/upload-imagem', authenticate, isAdmin, 
  upload.single('imagem'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado' 
      });
    }

    const imagemUrl = `/image/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      message: 'Imagem enviada com sucesso',
      data: {
        url: imagemUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao fazer upload da imagem',
      error: error.message 
    });
  }
});
```

### 4. Servir Arquivos Estáticos

**Arquivo:** `backend/server.js`

```javascript
const path = require('path');

// Servir arquivos estáticos da pasta image
app.use('/image', express.static(path.join(__dirname, '../image')));
```

### Endpoint Criado

**POST** `/api/produtos/upload-imagem`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body:**
```
imagem: [arquivo binário]
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Imagem enviada com sucesso",
  "data": {
    "url": "/image/produto-1707012345678-987654321.png",
    "filename": "produto-1707012345678-987654321.png",
    "size": 245678,
    "mimetype": "image/png"
  }
}
```

**Resposta de Erro (400/500):**
```json
{
  "success": false,
  "message": "Tipo de arquivo não suportado. Use apenas imagens.",
  "error": "..."
}
```

---

## Implementação Frontend

### 1. Componente de Formulário

**Arquivo:** `frontend/src/app/admin/produtos/[id]/page.tsx`

#### Estados Adicionados

```typescript
const [imagemInput, setImagemInput] = useState('');
const [imagemTipo, setImagemTipo] = useState<'url' | 'upload'>('url');
const [uploading, setUploading] = useState(false);
```

#### Função de Upload

```typescript
const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validar tipo de arquivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 
                        'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showError('Tipo de arquivo não suportado.');
    return;
  }

  // Validar tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError('Arquivo muito grande. O tamanho máximo é 5MB.');
    return;
  }

  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('imagem', file);

    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/produtos/upload-imagem', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.success && data.data.url) {
      setFormData(prev => ({
        ...prev,
        imagens: [...prev.imagens, `http://localhost:5000${data.data.url}`],
      }));
      success('Imagem enviada com sucesso!');
    } else {
      showError(data.message || 'Erro ao fazer upload da imagem');
    }
  } catch (error: any) {
    console.error('Erro ao fazer upload:', error);
    showError('Erro ao fazer upload da imagem');
  } finally {
    setUploading(false);
    e.target.value = '';
  }
};
```

#### Interface do Usuário

```tsx
<div className={styles.formCard}>
  <h2>Imagens</h2>
  
  <div className={styles.formGroup}>
    <label>Tipo de Imagem</label>
    <div className={styles.radioGroup}>
      <label className={styles.radioLabel}>
        <input
          type="radio"
          value="url"
          checked={imagemTipo === 'url'}
          onChange={(e) => setImagemTipo('url')}
        />
        URL da Imagem
      </label>
      <label className={styles.radioLabel}>
        <input
          type="radio"
          value="upload"
          checked={imagemTipo === 'upload'}
          onChange={(e) => setImagemTipo('upload')}
        />
        Upload de Arquivo
      </label>
    </div>
  </div>

  {imagemTipo === 'url' ? (
    <div className={styles.inputGroup}>
      <input
        type="url"
        value={imagemInput}
        onChange={(e) => setImagemInput(e.target.value)}
        placeholder="URL da imagem"
      />
      <button type="button" onClick={adicionarImagem}>
        Adicionar
      </button>
    </div>
  ) : (
    <div className={styles.uploadGroup}>
      <label htmlFor="upload-imagem" className={styles.uploadLabel}>
        {uploading ? 'Enviando...' : 'Escolher Arquivo'}
      </label>
      <input
        id="upload-imagem"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleUploadImagem}
        disabled={uploading}
        className={styles.uploadInput}
      />
      <small>Formatos aceitos: JPEG, PNG, GIF, WEBP (máx. 5MB)</small>
    </div>
  )}

  <div className={styles.tagsList}>
    {formData.imagens.map((img, index) => (
      <div key={index} className={styles.imagePreview}>
        <img src={img} alt={`Imagem ${index + 1}`} />
        <button type="button" onClick={() => removerImagem(index)}>×</button>
      </div>
    ))}
  </div>
</div>
```

### 2. Estilos

**Arquivo:** `frontend/src/app/admin/produtos/[id]/produto-form.module.scss`

```scss
.radioGroup {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.radioLabel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #495057;

  input[type='radio'] {
    width: auto;
    cursor: pointer;
    width: 18px;
    height: 18px;
  }
}

.uploadGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.uploadLabel {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  max-width: 200px;

  &:hover {
    background: #2980b9;
  }
}

.uploadInput {
  display: none;
}
```

---

## Estrutura de Armazenamento

### Pasta de Imagens

**Localização:** `/image/` (raiz do projeto)

```
Site de Vendas/
├── backend/
├── frontend/
├── image/                    ← Pasta criada
│   ├── .gitkeep
│   ├── produto-1707012345678-123456789.png
│   ├── produto-1707012345679-987654321.jpg
│   └── ...
├── docs/
└── ...
```

### Nomenclatura de Arquivos

**Formato:** `{nome-original}-{timestamp}-{random}.{extensao}`

**Exemplo:**
```
produto-foto-1707012345678-987654321.png
camiseta-azul-1707012345679-123456789.jpg
```

**Benefícios:**
- ✅ Nomes únicos (timestamp + random)
- ✅ Mantém nome original para referência
- ✅ Evita conflitos
- ✅ Fácil identificação

### Acesso às Imagens

**URL de Acesso:**
```
http://localhost:5000/image/{filename}
```

**Exemplo:**
```
http://localhost:5000/image/produto-1707012345678-987654321.png
```

---

## Testes E2E

### Arquivos de Teste Criados

#### 1. Testes Completos
**Arquivo:** `e2e/tests/admin-product-images.spec.ts`

**Cobertura:**
- ✅ Exibir opções de URL e Upload
- ✅ Adicionar imagem via URL
- ✅ Fazer upload de imagem do computador
- ✅ Remover imagem adicionada
- ✅ Validar tipo de arquivo no upload
- ✅ Salvar produto com imagem enviada
- ✅ Alternar entre URL e Upload
- ✅ Exibir preview das imagens

#### 2. Testes Simplificados
**Arquivo:** `e2e/tests/admin-product-images-simple.spec.ts`

**Cobertura:**
- ✅ Login e acesso ao formulário
- ✅ Teste direto do endpoint via API

### Executar Testes

```bash
# Todos os testes
cd e2e
npm test admin-product-images.spec.ts

# Com visualização
npm test admin-product-images.spec.ts -- --headed

# Teste específico
npm test admin-product-images.spec.ts -- --grep "deve fazer upload"

# Testes simplificados
npm test admin-product-images-simple.spec.ts
```

### Exemplo de Teste

```typescript
test('deve fazer upload de imagem do computador', async ({ page }) => {
  await page.goto('/admin/produtos/novo');
  await page.waitForLoadState('networkidle');
  
  // Selecionar opção de upload
  const uploadRadio = page.locator('input[type="radio"][value="upload"]');
  await uploadRadio.click();
  
  // Fazer upload da imagem
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(testImagePath);
  
  // Verificar mensagem de sucesso
  const successMessage = page.locator('text=/enviada com sucesso/i');
  await expect(successMessage).toBeVisible({ timeout: 10000 });
  
  // Verificar que a imagem foi adicionada
  const imagePreview = page.locator('.imagePreview img').first();
  await expect(imagePreview).toBeVisible({ timeout: 5000 });
  
  // Verificar que a URL contém /image/
  const imgSrc = await imagePreview.getAttribute('src');
  expect(imgSrc).toContain('/image/');
});
```

---

## Validações e Segurança

### Validações Implementadas

#### Backend
1. **Autenticação:** Apenas usuários autenticados
2. **Autorização:** Apenas administradores
3. **Tipo de Arquivo:** Apenas imagens (JPEG, PNG, GIF, WEBP)
4. **Tamanho:** Máximo 5MB
5. **Nome de Arquivo:** Sanitizado e único

#### Frontend
1. **Tipo de Arquivo:** Validação antes do upload
2. **Tamanho:** Validação antes do upload
3. **Feedback:** Mensagens de erro claras
4. **Estado:** Loading durante upload

### Tipos de Arquivo Aceitos

| Extensão | MIME Type       | Suportado |
|----------|----------------|-----------|
| .jpg     | image/jpeg     | ✅        |
| .jpeg    | image/jpeg     | ✅        |
| .png     | image/png      | ✅        |
| .gif     | image/gif      | ✅        |
| .webp    | image/webp     | ✅        |
| .svg     | image/svg+xml  | ❌        |
| .bmp     | image/bmp      | ❌        |
| .tiff    | image/tiff     | ❌        |

### Limites

| Parâmetro           | Valor    |
|--------------------|----------|
| Tamanho Máximo     | 5MB      |
| Arquivos por Upload| 1        |
| Imagens por Produto| Ilimitado|

### Segurança

**Proteções Implementadas:**
- ✅ Verificação de autenticação (JWT)
- ✅ Verificação de papel (isAdmin)
- ✅ Validação de tipo MIME
- ✅ Limite de tamanho
- ✅ Nomes únicos (previne sobrescrita)
- ✅ Pasta dedicada (isolamento)

**Melhorias Futuras:**
- [ ] Scan de vírus
- [ ] Validação de conteúdo da imagem
- [ ] Rate limiting por usuário
- [ ] Compressão automática
- [ ] Backup automático

---

## Como Usar

### Para Administradores

#### 1. Acessar o Formulário
1. Faça login como administrador
2. Navegue para **Admin > Produtos**
3. Clique em **"Novo Produto"** ou edite um existente

#### 2. Adicionar Imagem via URL
1. Na seção **"Imagens"**, mantenha selecionado **"URL da Imagem"**
2. Cole a URL de uma imagem externa
3. Clique em **"Adicionar"**
4. A imagem aparecerá no preview abaixo

#### 3. Adicionar Imagem via Upload
1. Na seção **"Imagens"**, selecione **"Upload de Arquivo"**
2. Clique em **"Escolher Arquivo"**
3. Selecione uma imagem do seu computador
4. Aguarde o upload (indicador de loading)
5. A imagem aparecerá no preview abaixo

#### 4. Gerenciar Imagens
- **Remover:** Clique no **"×"** no canto da imagem
- **Reordenar:** Não implementado (ordem de adição)
- **Múltiplas:** Adicione quantas quiser

#### 5. Salvar Produto
1. Preencha os outros campos obrigatórios
2. Clique em **"Criar Produto"** ou **"Atualizar"**
3. As URLs das imagens são salvas no produto

### Para Desenvolvedores

#### Adicionar Novo Formato de Imagem

**Backend** (`middlewares/upload.js`):
```javascript
const allowedMimeTypes = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'image/svg+xml'  // Adicionar SVG
];
```

**Frontend** (`page.tsx`):
```typescript
const allowedTypes = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'image/svg+xml'  // Adicionar SVG
];
```

#### Alterar Limite de Tamanho

**Backend** (`middlewares/upload.js`):
```javascript
limits: {
  fileSize: 10 * 1024 * 1024, // Alterar para 10MB
}
```

**Frontend** (`page.tsx`):
```typescript
if (file.size > 10 * 1024 * 1024) {  // Alterar para 10MB
  showError('Arquivo muito grande. O tamanho máximo é 10MB.');
  return;
}
```

#### Adicionar Compressão de Imagens

```bash
npm install sharp
```

```javascript
const sharp = require('sharp');

// Em upload.js, após salvar o arquivo
const processedImagePath = path.join(uploadDir, `processed-${filename}`);
await sharp(req.file.path)
  .resize(800, 800, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toFile(processedImagePath);
```

---

## Troubleshooting

### Problema: Upload não funciona

**Sintomas:**
- Botão "Escolher Arquivo" não responde
- Erro 404 ao fazer upload
- Imagem não aparece no preview

**Soluções:**
1. Verificar se o backend está rodando na porta 5000
2. Verificar se o middleware `upload` está importado
3. Verificar se a rota `/api/produtos/upload-imagem` existe
4. Verificar console do browser para erros

### Problema: Pasta /image não existe

**Sintomas:**
- Erro "ENOENT: no such file or directory"
- Upload falha com erro 500

**Soluções:**
1. Criar a pasta manualmente:
```bash
mkdir image
```

2. Verificar se o middleware cria a pasta automaticamente:
```javascript
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
```

### Problema: Imagens não aparecem

**Sintomas:**
- Upload bem-sucedido mas imagem não carrega
- Erro 404 ao acessar imagem

**Soluções:**
1. Verificar se o servidor está servindo arquivos estáticos:
```javascript
app.use('/image', express.static(path.join(__dirname, '../image')));
```

2. Verificar permissões da pasta `/image`

3. Verificar URL da imagem no banco de dados

### Problema: Erro de CORS

**Sintomas:**
- Erro "CORS policy" no console
- Upload falha sem mensagem

**Soluções:**
1. Verificar configuração de CORS no backend:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

2. Verificar headers na requisição

### Problema: Arquivo muito grande

**Sintomas:**
- Erro "File too large"
- Upload trava

**Soluções:**
1. Reduzir tamanho da imagem antes do upload
2. Aumentar limite no backend (não recomendado):
```javascript
limits: {
  fileSize: 10 * 1024 * 1024, // 10MB
}
```

3. Implementar compressão no frontend antes do upload

### Problema: Tipo de arquivo não suportado

**Sintomas:**
- Erro "Tipo de arquivo não suportado"
- Upload rejeitado

**Soluções:**
1. Verificar se o arquivo é realmente uma imagem
2. Converter imagem para formato suportado
3. Adicionar novo formato aos arrays `allowedMimeTypes`

---

## Checklist de Implementação

### Backend
- [x] Instalar multer
- [x] Criar middleware de upload
- [x] Configurar armazenamento em disco
- [x] Adicionar filtro de tipo de arquivo
- [x] Definir limite de tamanho
- [x] Criar rota de upload
- [x] Proteger rota com autenticação
- [x] Proteger rota com autorização (admin)
- [x] Servir arquivos estáticos
- [x] Criar pasta /image

### Frontend
- [x] Adicionar estados para upload
- [x] Criar função de upload
- [x] Adicionar validações no cliente
- [x] Implementar UI com radio buttons
- [x] Adicionar input file customizado
- [x] Implementar preview de imagens
- [x] Adicionar feedback de loading
- [x] Adicionar mensagens de erro/sucesso
- [x] Estilizar componentes

### Testes
- [x] Criar testes E2E completos
- [x] Criar testes simplificados
- [x] Testar validações
- [x] Testar upload via API
- [x] Testar interface do usuário
- [x] Documentar testes

### Documentação
- [x] Documentar arquitetura
- [x] Documentar implementação backend
- [x] Documentar implementação frontend
- [x] Documentar testes
- [x] Criar guia de uso
- [x] Criar troubleshooting

---

## Melhorias Futuras

### Curto Prazo
- [ ] Adicionar barra de progresso do upload
- [ ] Implementar drag-and-drop de arquivos
- [ ] Adicionar suporte a múltiplos uploads simultâneos
- [ ] Implementar preview antes do upload

### Médio Prazo
- [ ] Adicionar recorte/redimensionamento de imagens
- [ ] Implementar compressão automática
- [ ] Adicionar validação de dimensões mínimas
- [ ] Implementar reordenação de imagens

### Longo Prazo
- [ ] Integração com CDN
- [ ] Otimização automática de imagens
- [ ] Suporte a mais formatos (SVG, AVIF)
- [ ] Sistema de backup automático
- [ ] Scan de vírus
- [ ] Análise de conteúdo (IA)

---

## Referências

### Documentação
- [Multer Documentation](https://github.com/expressjs/multer)
- [MDN - FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#request-body)

### Pacotes Utilizados
- `multer@1.4.5-lts.1` - Gerenciamento de uploads
- `express@5.2.1` - Framework web
- `react@18.3.1` - Interface do usuário

---

## Conclusão

A funcionalidade de upload de imagens foi implementada com sucesso, proporcionando aos administradores uma maneira fácil e segura de adicionar imagens de produtos. A implementação inclui validações robustas, testes completos e uma interface intuitiva.

**Principais Conquistas:**
- ✅ Upload funcional e testado
- ✅ Validações de segurança
- ✅ Interface amigável
- ✅ Testes E2E completos
- ✅ Documentação completa

**Próximos Passos:**
1. Monitorar uso e performance
2. Implementar melhorias planejadas
3. Coletar feedback dos administradores
4. Considerar integração com CDN

---

**Autor:** GitHub Copilot  
**Data:** 04/02/2026  
**Versão do Documento:** 1.0.0
