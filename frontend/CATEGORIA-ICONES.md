# 🎨 Guia de Configuração de Ícones de Categorias

**Data:** 5 de fevereiro de 2026  
**Status:** ✅ Implementado

---

## 📋 Sumário

Foi criado um arquivo centralizado de configuração para ícones e cores de categorias, permitindo fácil manutenção e reutilização em todo o projeto.

---

## 📁 Arquivo Principal

**Localização:** `src/config/categoryIcons.ts`

---

## 🎯 Categorias e Ícones Atualizados

| Categoria | Slug | Ícone | Cor |
|-----------|------|-------|-----|
| 👗 Roupas Femininas | `roupas-femininas` | 👗 | #FFE5E5 |
| 👔 Roupas Masculinas | `roupas-masculinas` | 👔 | #E5F2FF |
| 👜 Acessórios | `acessorios` | 👜 | #FFF5E5 |
| 👟 Calçados | `calcados` | 👟 | #F0E5FF |
| 👖 Calças | `calcas` | 👖 | #F5F0FF |
| 👕 Camisas | `camisas` | 👕 | #FFF0E5 |
| 👟 Tênis | `tenis` | 👟 | #E5F5FF |
| 🛍️ Outros | `outros` | 🛍️ | #FFE5F5 |

---

## 💻 Como Usar

### 1️⃣ Importar as Funções

```tsx
import { 
  getCategoryIcon, 
  getCategoryColor,
  getCategoryConfig,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  DEFAULT_CATEGORIES
} from '@/config/categoryIcons';
```

### 2️⃣ Usar em Componentes

#### Obter ícone de uma categoria:
```tsx
const icon = getCategoryIcon('roupas-femininas');
// Retorna: '👗'
```

#### Obter cor de uma categoria:
```tsx
const color = getCategoryColor('acessorios');
// Retorna: '#FFF5E5'
```

#### Obter configuração completa:
```tsx
const config = getCategoryConfig('calcados', 'Calçados');
// Retorna: 
// {
//   icon: '👟',
//   color: '#F0E5FF',
//   slug: 'calcados',
//   label: 'Calçados'
// }
```

### 3️⃣ Exemplos Práticos

#### Renderizar Card de Categoria:
```tsx
'use client';

import { getCategoryIcon, getCategoryColor } from '@/config/categoryIcons';
import Link from 'next/link';

export default function CategoryCard({ categoria }) {
  const icon = getCategoryIcon(categoria.slug, categoria.nome);
  const color = getCategoryColor(categoria.slug, categoria.nome);

  return (
    <Link href={`/produtos?categoria=${categoria.slug}`}>
      <div style={{ 
        background: color,
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '3rem' }}>{icon}</span>
        <h3>{categoria.nome}</h3>
      </div>
    </Link>
  );
}
```

#### Em um Select/Dropdown:
```tsx
import { DEFAULT_CATEGORIES } from '@/config/categoryIcons';

export default function CategorySelect() {
  return (
    <select>
      <option value="">Selecione uma categoria</option>
      {DEFAULT_CATEGORIES.map(cat => (
        <option key={cat.id} value={cat.slug}>
          {cat.icon} {cat.nome}
        </option>
      ))}
    </select>
  );
}
```

#### Em uma Admin Panel:
```tsx
import { getCategoryConfig } from '@/config/categoryIcons';

export default function AdminCategories({ categorias }) {
  return (
    <table>
      <tbody>
        {categorias.map(cat => {
          const config = getCategoryConfig(cat.slug, cat.nome);
          return (
            <tr key={cat.id}>
              <td>{config.icon} {config.label}</td>
              <td style={{ 
                backgroundColor: config.color,
                padding: '8px'
              }}>
                {config.color}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

---

## 🔄 Áreas Atualizadas

### ✅ Arquivos Modificados

1. **src/app/page.tsx**
   - Imports adicionados
   - Usa a configuração centralizada
   - Fallback para emojis melhorado

2. **src/config/categoryIcons.ts** (NOVO)
   - Configuração centralizada
   - Funções helper
   - Default categories

---

## 🎨 Customização de Ícones

### Adicionar Nova Categoria:

```tsx
// Em src/config/categoryIcons.ts

export const CATEGORY_ICONS = {
  // ... ícones existentes
  'nova-categoria': '🎉',  // Adicione aqui
};

export const CATEGORY_COLORS = {
  // ... cores existentes
  'nova-categoria': '#E5F5FF',  // Adicione aqui
};
```

### Mudar um Ícone:

```tsx
// Antes
'calcas': '👖',

// Depois (se quiser usar ícone diferente)
'calcas': '👕',
```

### Alterar Cor:

```tsx
// Antes
'roupas-femininas': '#FFE5E5',

// Depois
'roupas-femininas': '#FFB3B3',
```

---

## 📸 Alternativa: Usando Imagens em Vez de Emojis

Se preferir usar imagens/fotos em vez de emojis:

```tsx
// No banco de dados ou em uma config
interface Category {
  id: number;
  nome: string;
  slug: string;
  icone?: string;  // emoji ou URL de imagem
  imagem?: string; // imagem grande
  cor?: string;    // cor de fundo
}

// Em um componente
<div style={{ 
  background: categoria.cor,
  backgroundImage: categoria.icone?.startsWith('http') 
    ? `url(${categoria.icone})` 
    : 'none'
}}>
  {!categoria.icone?.startsWith('http') && (
    <span>{categoria.icone}</span>
  )}
</div>
```

---

## 🎯 Próximas Melhorias

### 1. Adicionar Imagens de Categorias
```tsx
export const CATEGORY_IMAGES = {
  'roupas-femininas': '/images/categories/feminino.jpg',
  'roupas-masculinas': '/images/categories/masculino.jpg',
  // ... etc
};
```

### 2. Criar Componente CategoryIcon Reutilizável
```tsx
// src/components/CategoryIcon/CategoryIcon.tsx
export default function CategoryIcon({ 
  slug, 
  name, 
  size = 'medium' 
}) {
  const icon = getCategoryIcon(slug, name);
  const sizeMap = {
    small: '1rem',
    medium: '2rem',
    large: '3rem'
  };
  
  return <span style={{ fontSize: sizeMap[size] }}>{icon}</span>;
}
```

### 3. Sync com Backend
```tsx
// Carregar categorias do backend com ícones
const response = await categoryService.getAll();
// Backend retorna: { id, nome, slug, icone, cor }
```

---

## 🧪 Testes

### Testar Ícones:
```tsx
import { getCategoryIcon } from '@/config/categoryIcons';

describe('categoryIcons', () => {
  it('should return correct icon', () => {
    const icon = getCategoryIcon('roupas-femininas');
    expect(icon).toBe('👗');
  });

  it('should return fallback for unknown category', () => {
    const icon = getCategoryIcon('unknown');
    expect(icon).toBe('🛍️');
  });
});
```

---

## 📊 Comparação: Antes vs Depois

### ANTES:
```tsx
// Múltiplos imports e duplicação
const categoryIcons: any = {
  'roupas-femininas': '👗',
  // ... repetido em vários arquivos
};

const categoryColors: any = {
  'roupas-femininas': '#FFE5E5',
  // ... duplicado
};
```

### DEPOIS:
```tsx
// Um único arquivo centralizado
import { getCategoryIcon, getCategoryColor } from '@/config/categoryIcons';

const icon = getCategoryIcon('roupas-femininas');
const color = getCategoryColor('roupas-femininas');
```

---

## 💡 Dicas de Uso

### 1. Sempre Use Slug em Minúsculas
```tsx
// ✅ Correto
getCategoryIcon('roupas-femininas')

// ❌ Evitar
getCategoryIcon('Roupas Femininas')
```

### 2. Combine com Nome como Fallback
```tsx
// ✅ Melhor (tenta slug, depois nome)
getCategoryIcon(categoria.slug, categoria.nome)

// ❌ Menos robusto
getCategoryIcon(categoria.slug)
```

### 3. Use getCategoryConfig para Dados Completos
```tsx
// ✅ Quando precisa ícone, cor e mais
const config = getCategoryConfig(slug, name);

// ❌ Múltiplas chamadas desnecessárias
const icon = getCategoryIcon(slug, name);
const color = getCategoryColor(slug, name);
```

---

## 🔗 Referências

**Arquivo:** [src/config/categoryIcons.ts](../src/config/categoryIcons.ts)  
**Página Principal:** [src/app/page.tsx](../src/app/page.tsx)

---

## ✅ Checklist de Implementação

- [x] Criar arquivo de configuração centralizado
- [x] Adicionar todas as categorias
- [x] Adicionar ícones
- [x] Adicionar cores
- [x] Atualizar src/app/page.tsx
- [x] Criar funções helper
- [x] Documentar uso
- [ ] Adicionar imagens de categorias (opcional)
- [ ] Criar componente CategoryIcon reutilizável
- [ ] Sincronizar com backend se necessário

---

**Desenvolvido em:** 5 de fevereiro de 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para Produção
