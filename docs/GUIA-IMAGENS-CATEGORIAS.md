# Guia de Imagens de Categorias

## Visão Geral

O sistema de categorias foi atualizado para usar **imagens personalizadas** ao invés de apenas emojis. Isso oferece uma experiência visual muito mais profissional e atrativa.

## Estrutura de Diretórios

```
frontend/
└── public/
    └── images/
        └── categories/
            ├── roupas-femininas.jpg
            ├── roupas-masculinas.jpg
            ├── acessorios.jpg
            ├── calcados.jpg
            ├── calcas.jpg
            ├── camisas.jpg
            ├── tenis.jpg
            └── outros.jpg
```

## Configuração Central

**Arquivo:** `src/config/categoryIcons.ts`

### CATEGORY_IMAGES
Mapeia slugs de categorias para URLs de imagens:

```typescript
export const CATEGORY_IMAGES = {
  'roupas-femininas': '/images/categories/roupas-femininas.jpg',
  'roupas-masculinas': '/images/categories/roupas-masculinas.jpg',
  'acessorios': '/images/categories/acessorios.jpg',
  'calcados': '/images/categories/calcados.jpg',
  'calcas': '/images/categories/calcas.jpg',
  'camisas': '/images/categories/camisas.jpg',
  'tenis': '/images/categories/tenis.jpg',
  'outros': '/images/categories/outros.jpg',
};
```

### Função getCategoryImage()
Recupera a URL da imagem para uma categoria:

```typescript
const imagemUrl = getCategoryImage('roupas-femininas');
// Retorna: '/images/categories/roupas-femininas.jpg'

const imagemUrl = getCategoryImage(categoria.slug, categoria.nome);
// Funciona com slug ou nome como fallback
```

## Uso nas Páginas

### src/app/page.tsx

As categorias agora renderizam com imagens de fundo:

```tsx
import { getCategoryImage, getCategoryColor } from '@/config/categoryIcons';

// Na renderização:
<div className={styles.categoryImage} style={{ 
  background: getCategoryColor(categoria.slug),
  backgroundImage: `url(${getCategoryImage(categoria.slug, categoria.nome)})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}}>
  {/* Conteúdo - emojis como fallback */}
</div>
```

## Especificações de Imagens

### Recomendações

| Aspecto | Valor |
|---------|-------|
| Formato | JPG, PNG ou WebP |
| Dimensões | 400x300px ou 800x600px |
| Resolução | 72+ DPI |
| Tamanho Arquivo | < 100KB por imagem |
| Proporção | 4:3 ou 16:12 |

### Qualidade

- **Transparência:** Use PNG para categorias que precisem de transparência
- **Otimização:** Comprima imagens para melhor performance
- **Alt Text:** Adicione nomes descritivos aos arquivos
- **Cor de Fundo:** Mantenha as cores de fallback para carregamento

## Categorias e Cores de Fallback

| Categoria | Slug | Imagem | Cor Fallback |
|-----------|------|--------|--------------|
| Roupas Femininas | `roupas-femininas` | `/images/categories/roupas-femininas.jpg` | #FFE5E5 (rosa claro) |
| Roupas Masculinas | `roupas-masculinas` | `/images/categories/roupas-masculinas.jpg` | #E5F2FF (azul claro) |
| Acessórios | `acessorios` | `/images/categories/acessorios.jpg` | #FFF5E5 (laranja claro) |
| Calçados | `calcados` | `/images/categories/calcados.jpg` | #F0E5FF (roxo claro) |
| Calças | `calcas` | `/images/categories/calcas.jpg` | #F5F0FF (roxo clarissimo) |
| Camisas | `camisas` | `/images/categories/camisas.jpg` | #FFF0E5 (laranja muito claro) |
| Tênis | `tenis` | `/images/categories/tenis.jpg` | #E5F5FF (azul clarissimo) |
| Outros | `outros` | `/images/categories/outros.jpg` | #FFE5F5 (rosa clarissimo) |

## Adicionar Novas Categorias

### 1. Adicione a Imagem
Coloque a imagem em: `frontend/public/images/categories/seu-slug.jpg`

### 2. Atualize CATEGORY_IMAGES
Em `src/config/categoryIcons.ts`:

```typescript
export const CATEGORY_IMAGES = {
  // ... categorias existentes ...
  'seu-slug': '/images/categories/seu-slug.jpg',
};
```

### 3. Atualize CATEGORY_COLORS (opcional)
```typescript
export const CATEGORY_COLORS = {
  // ... cores existentes ...
  'seu-slug': '#HEXCOLOR',
};
```

### 4. Atualize CATEGORY_ICONS (para emojis de fallback)
```typescript
export const CATEGORY_ICONS = {
  // ... ícones existentes ...
  'seu-slug': '🎨', // emoji apropriado
};
```

## Fallbacks e Compatibilidade

### Cadeia de Fallback

1. **Imagem Carregada:** Se a imagem `/images/categories/xxx.jpg` existir
2. **Cor de Fundo:** Se a imagem não carregar, usa a cor de fallback
3. **Emoji:** Se nenhuma imagem ou cor, exibe emoji em grande tamanho

### HTML/CSS Renderizado
```html
<div class="categoryImage" style="
  background: #FFE5E5;
  background-image: url(/images/categories/roupas-femininas.jpg);
  background-size: cover;
  background-position: center;
">
  <span style="font-size: 4rem;">👗</span>
</div>
```

## Performance

### Otimizações

1. **Lazy Loading:** Imagens carregam apenas quando visíveis
2. **Next.js Image Component (Futuro):** Migrar para `<Image />` do Next.js para melhor otimização
3. **WebP Format:** Considere converter para WebP para melhor compressão

### Exemplo com Image Component (Futuro)
```tsx
import Image from 'next/image';

<Image
  src={getCategoryImage(slug)}
  alt={nome}
  width={400}
  height={300}
  className={styles.categoryImage}
  priority={false}
/>
```

## Suporte a Múltiplos Idiomas

O sistema suporta slugs em múltiplas formas:

```typescript
// Ambos funcionam:
getCategoryImage('roupas-femininas');
getCategoryImage('roupas femininas');

// Com fallback para nome:
getCategoryImage(undefined, 'Roupas Femininas');
```

## Resolução de Problemas

### Imagem Não Carrega

1. Verifique se o arquivo existe em `public/images/categories/`
2. Verifique o nome do arquivo (sensível a maiúsculas/minúsculas)
3. Verifique a URL em `CATEGORY_IMAGES`
4. Use DevTools → Network para ver o erro de carregamento

### Cor de Fundo Não Aparece

1. Verifique se `getCategoryColor()` retorna um hex válido
2. Verifique se `CATEGORY_COLORS` foi atualizado corretamente
3. Verifique se o CSS usa `background` e não `backgroundColor`

### Emoji Aparecendo Acima da Imagem

Isso é intencional - o emoji serve como fallback visual se a imagem não carregar.

## Migrations Futuras

- [ ] Converter emojis para ícones Lucide React nas cards
- [ ] Implementar `<Image />` component do Next.js
- [ ] Adicionar lazy loading com Intersection Observer
- [ ] Criar variantes de imagem (thumb, full)
- [ ] Integrar com CMS para categorias dinâmicas

## Arquivos Relacionados

- `src/config/categoryIcons.ts` - Configuração central
- `src/app/page.tsx` - Homepage com categorias
- `frontend/public/images/categories/` - Armazém de imagens
- `GUIA-ALERTAS-ICONES.md` - Guia de ícones e alertas
- `CATEGORIA-ICONES.md` - Documentação anterior de ícones

---

**Data de Atualização:** 2026-02-05  
**Versão:** 2.0 (Com Suporte a Imagens)  
**Status:** ✅ Produção
