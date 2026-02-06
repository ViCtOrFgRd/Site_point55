# Testes E2E - Upload de Imagens de Produtos

## Funcionalidade Implementada

Foi adicionada a funcionalidade de upload de imagens no cadastro de produtos da área administrativa.

### Recursos:
- Upload de arquivos de imagem (JPEG, PNG, GIF, WEBP)
- Limite de 5MB por arquivo
- Opção de adicionar por URL ou fazer upload
- Preview das imagens adicionadas
- Armazenamento na pasta `/image` na raiz do projeto

## Arquivos de Teste

### Testes Completos
**Arquivo:** `tests/admin-product-images.spec.ts`

Contém 8 testes que cobrem:
1. ✓ Exibir opções de URL e Upload
2. ✓ Adicionar imagem via URL
3. ✓ Fazer upload de imagem do computador
4. ✓ Remover imagem adicionada
5. ✓ Validar tipo de arquivo no upload
6. ✓ Salvar produto com imagem enviada
7. ✓ Alternar entre URL e Upload sem perder imagens
8. ✓ Exibir preview das imagens adicionadas

### Testes Simplificados (Debug)
**Arquivo:** `tests/admin-product-images-simple.spec.ts`

Contém 2 testes:
1. Login como admin e acesso ao formulário
2. Teste direto do endpoint de upload via API

## Como Executar

### Pré-requisitos
1. Backend rodando na porta 5000
2. Frontend rodando na porta 3000
3. Usuário admin cadastrado no banco

### Executar Todos os Testes
```powershell
cd e2e
npm test admin-product-images.spec.ts -- --project=chromium
```

### Executar Teste Específico
```powershell
npm test admin-product-images.spec.ts -- --grep "deve fazer upload"
```

### Executar com Interface Visual
```powershell
npm test admin-product-images.spec.ts -- --headed
```

### Executar Testes Simplificados
```powershell
npm test admin-product-images-simple.spec.ts
```

## Endpoint Testado

**POST** `/api/produtos/upload-imagem`

### Headers:
- Authorization: Bearer {token}

### Body (multipart/form-data):
- imagem: arquivo de imagem

### Resposta de Sucesso:
```json
{
  "success": true,
  "message": "Imagem enviada com sucesso",
  "data": {
    "url": "/image/nome-arquivo-1234567890.png",
    "filename": "nome-arquivo-1234567890.png",
    "size": 12345,
    "mimetype": "image/png"
  }
}
```

## Verificação Manual

### 1. Acessar o Formulário
1. Faça login como admin
2. Navegue para `/admin/produtos/novo`
3. Role até a seção "Imagens"

### 2. Testar Upload via URL
1. Selecione "URL da Imagem"
2. Cole uma URL de imagem (ex: https://via.placeholder.com/300)
3. Clique em "Adicionar"
4. Verifique o preview da imagem

### 3. Testar Upload de Arquivo
1. Selecione "Upload de Arquivo"
2. Clique em "Escolher Arquivo"
3. Selecione uma imagem do seu computador
4. Aguarde o upload completar
5. Verifique o preview e a mensagem de sucesso

### 4. Verificar Armazenamento
As imagens enviadas são armazenadas em:
```
/image/nome-arquivo-timestamp.extensao
```

E podem ser acessadas via:
```
http://localhost:5000/image/nome-arquivo-timestamp.extensao
```

## Troubleshooting

### Testes Falhando
1. Verifique se backend e frontend estão rodando
2. Confirme que existe um usuário admin no banco
3. Verifique as credenciais em `.env` ou `test-data.ts`
4. Limpe o cache do Next.js: `rm -rf .next`
5. Reinicie os servidores

### Elementos Não Encontrados
1. Aguarde o frontend recompilar completamente
2. Verifique o console do Next.js para erros
3. Execute o teste com `--headed` para visualizar

### Upload Falhando
1. Verifique se a pasta `/image` existe na raiz
2. Confirme permissões de escrita na pasta
3. Verifique o tamanho do arquivo (máx 5MB)
4. Confirme que o tipo de arquivo é suportado

## Estrutura de Arquivos Relacionados

```
backend/
  ├── middlewares/
  │   └── upload.js              # Configuração do multer
  ├── routes/
  │   └── produtos.js            # Rota de upload
  └── server.js                  # Servir arquivos estáticos

frontend/
  └── src/app/admin/produtos/[id]/
      ├── page.tsx               # Formulário com upload
      └── produto-form.module.scss  # Estilos

image/                          # Pasta de armazenamento
  └── .gitkeep

e2e/
  └── tests/
      ├── admin-product-images.spec.ts
      ├── admin-product-images-simple.spec.ts
      └── fixtures/
          └── test-image.png    # Criada durante os testes
```

## Melhorias Futuras

- [ ] Adicionar múltiplos uploads simultâneos
- [ ] Implementar recorte/redimensionamento de imagens
- [ ] Adicionar barra de progresso do upload
- [ ] Implementar drag-and-drop de arquivos
- [ ] Adicionar validação de dimensões mínimas
- [ ] Otimização automática de imagens
- [ ] Suporte a mais formatos (SVG, AVIF)
