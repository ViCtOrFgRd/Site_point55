# Frontend - Telas Admin de Configuração de Frete

## ✅ Implementado

Foram criadas 3 novas páginas no painel admin para gerenciar a configuração de frete:

---

## 1. Catálogo de Caixas

**Rota:** `/admin/caixas-catalogo`  
**Arquivo:** `frontend/src/app/admin/caixas-catalogo/page.tsx`

### Funcionalidades:
- ✅ Listar todas as caixas cadastradas (P/M/G)
- ✅ Filtrar por tamanho (P/M/G) e status (Ativo/Inativo)
- ✅ Criar nova caixa com validações
- ✅ Editar caixa existente (dimensões, peso, nome)
- ✅ Desativar caixa (com verificação de uso)
- ✅ Ativar caixa inativa
- ✅ Visualizar volume calculado (A×L×C)
- ✅ Modal para criação/edição

### Validações:
- Código: 2-10 caracteres, alfanumérico, único
- Dimensões: > 0 e ≤ 200 cm
- Peso caixa: ≥ 0 e ≤ 50 kg
- Não permite desativar se estiver em uso
- Não permite editar código e tamanho

### Campos do Formulário:
- Código (ex: P1, M2, G3) - não editável
- Nome (ex: Pequena 1, Média 2)
- Tamanho (P/M/G) - não editável
- Altura, Largura, Comprimento (cm)
- Peso da caixa vazia (kg)

---

## 2. Configuração Fallback

**Rota:** `/admin/config-fallback`  
**Arquivo:** `frontend/src/app/admin/config-fallback/page.tsx`

### Funcionalidades:
- ✅ Configurar 3 linhas fixas (P/M/G)
- ✅ Selecionar caixa de cada tamanho
- ✅ Definir capacidade média e peso médio por item
- ✅ Visualizar peso do volume calculado
- ✅ Visualizar dimensões da caixa selecionada
- ✅ Salvar configuração completa

### Interface:
- Tabela com 3 linhas (P/M/G)
- Colunas: Tamanho, Caixa, Dimensões, Capacidade, Peso/Item, Peso Volume
- Dropdowns filtrados por tamanho de caixa
- Cálculo automático do peso do volume
- Info box explicativa

### Uso:
Esta configuração é aplicada automaticamente para produtos que não possuem tipo ou cujo tipo não possui configuração específica.

---

## 3. Configuração por Tipo

**Rota:** `/admin/config-tipo`  
**Arquivo:** `frontend/src/app/admin/config-tipo/page.tsx`

### Funcionalidades:
- ✅ Selecionar tipo de produto (dropdown)
- ✅ Configurar 3 linhas (P/M/G) por tipo
- ✅ Criar novo tipo de produto
- ✅ Duplicar configuração de outro tipo
- ✅ Adicionar observações por linha
- ✅ Validar capacidades diferentes
- ✅ Salvar configuração completa

### Modais:
1. **Novo Tipo:**
   - Nome (ex: Chapéu, Meia)
   - Código (ex: chapeu, meia)
   
2. **Duplicar Config:**
   - Selecionar tipo de origem
   - Copia config completa (P/M/G)

### Interface:
- Seletor de tipo no topo
- Botões: Novo Tipo, Duplicar Config
- Tabela igual ao fallback + coluna Observações
- Validação: capacidades P, M, G devem ser diferentes

---

## Serviços API Adicionados

**Arquivo:** `frontend/src/services/api.ts`

### `caixaService`
```typescript
getAll(params?) // Listar caixas
getById(id) // Obter caixa
checkUsage(id) // Verificar uso
create(data) // Criar caixa
update(id, data) // Atualizar caixa
deactivate(id) // Desativar caixa
```

### `configFreteService`
```typescript
getFallback() // Obter config fallback
updateFallback(data) // Atualizar config fallback
```

### `tipoProdutoService`
```typescript
getAll(params?) // Listar tipos
getById(id) // Obter tipo
create(data) // Criar tipo
update(id, data) // Atualizar tipo
getEmbalagem(id) // Obter config embalagem
updateEmbalagem(id, data) // Atualizar config embalagem
duplicateEmbalagem(id, tipoOrigemId) // Duplicar config
```

---

## Estilos Compartilhados

**Arquivo:** `frontend/src/app/admin/admin.module.scss`

Foram adicionados estilos globais para todas as páginas admin:

### Classes Principais:
- `.container` - Container principal
- `.loading` - Estado de carregamento
- `.header` - Cabeçalho com título e ações
- `.backButton` - Botão voltar
- `.primaryButton` / `.secondaryButton` - Botões de ação
- `.filters` - Filtros
- `.tableContainer` / `.table` - Tabelas
- `.badge` - Badges coloridos (P/M/G, Success/Danger)
- `.modal` - Modais
- `.form` / `.formGroup` - Formulários
- `.infoBox` - Caixas informativas

### Badges de Tamanho:
- `.badgeP` - Azul (Pequena)
- `.badgeM` - Amarelo (Média)
- `.badgeG` - Verde (Grande)

### Responsivo:
- Mobile-first
- Breakpoint: 768px
- Tabelas e formulários adaptados

---

## Painel Admin Atualizado

**Arquivo:** `frontend/src/app/admin/page.tsx`

Adicionados 3 novos cards:

1. **Catálogo de Caixas** (roxo)
   - Ícone: Package
   - Link: `/admin/caixas-catalogo`

2. **Config Fallback** (azul claro)
   - Ícone: Settings
   - Link: `/admin/config-fallback`

3. **Config por Tipo** (laranja)
   - Ícone: Sliders
   - Link: `/admin/config-tipo`

---

## Fluxo de Uso

### 1. Configuração Inicial

1. **Acessar "Catálogo de Caixas"**
   - Verificar caixas P/M/G criadas no seed
   - Adicionar novas caixas se necessário

2. **Acessar "Config Fallback"**
   - Configurar P/M/G padrão
   - Definir capacidades e pesos médios
   - Salvar

3. **Acessar "Config por Tipo"**
   - Selecionar tipo (ex: Tênis)
   - Configurar P/M/G específico
   - Salvar

### 2. Criação de Novo Tipo

1. Clicar em "Novo Tipo"
2. Preencher nome e código
3. Criar
4. Configurar embalagens P/M/G
5. Salvar

### 3. Duplicação de Config

1. Selecionar tipo destino
2. Clicar em "Duplicar Config"
3. Selecionar tipo origem
4. Confirmar
5. Editar se necessário
6. Salvar

---

## Exemplo de Uso Completo

### Cenário: Configurar tipo "Tênis"

1. **Criar Tipo** (se não existir):
   - Nome: Tênis
   - Código: tenis

2. **Configurar Embalagens**:
   - **P:** Caixa P2 | Cap: 1 | Peso/item: 0.9 kg
   - **M:** Caixa M1 | Cap: 2 | Peso/item: 0.9 kg
   - **G:** Caixa G1 | Cap: 4 | Peso/item: 0.9 kg

3. **Resultado**:
   - 1 tênis → Caixa P2 (peso: 1.05 kg)
   - 2 tênis → Caixa M1 (peso: 2.10 kg)
   - 4 tênis → Caixa G1 (peso: 4.20 kg)

---

## Validações e Segurança

✅ Todas as rotas requerem autenticação admin  
✅ Validações client-side e server-side  
✅ Verificação de uso antes de desativar  
✅ Capacidades P/M/G devem ser diferentes  
✅ Apenas caixas ativas aparecem nos dropdowns  
✅ Código e tamanho não editáveis após criação  

---

## Próximos Passos

Para completar a integração:

1. ⏳ **Adicionar campo `tipo_produto_id` no cadastro de produtos**
   - Dropdown para selecionar tipo
   - Campo opcional (usa fallback se nulo)

2. ⏳ **Integrar `embalagemService` no checkout**
   - No cálculo de frete, usar `calcularVolumesFrete(itens)`
   - Formatar volumes para API de frete
   - Enviar para Superfrete/Correios

---

## Arquivos Criados/Modificados

### Criados:
- `frontend/src/app/admin/caixas-catalogo/page.tsx`
- `frontend/src/app/admin/config-fallback/page.tsx`
- `frontend/src/app/admin/config-tipo/page.tsx`

### Modificados:
- `frontend/src/services/api.ts` - Adicionados 3 novos serviços
- `frontend/src/app/admin/admin.module.scss` - Estilos compartilhados
- `frontend/src/app/admin/page.tsx` - 3 novos cards

---

## Compatibilidade

- ✅ Next.js 14
- ✅ TypeScript
- ✅ React Icons
- ✅ Módulos SCSS
- ✅ Mobile responsivo
- ✅ AuthContext integrado
