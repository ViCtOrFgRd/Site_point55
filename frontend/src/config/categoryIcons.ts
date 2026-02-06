// src/config/categoryIcons.ts

export const CATEGORY_ICONS = {
  // Ícones por slug (fallback)
  'roupas-femininas': '👗',
  'roupas-masculinas': '👔',
  'acessorios': '👜',
  'acessórios': '👜',
  'calcados': '👟',
  'calçados': '👟',
  'calcas': '👖',
  'camisas': '👕',
  'tenis': '👟',
  'tênnis': '👟',
  'outros': '🛍️',
  
  // Ícones por nome (fallback)
  'Roupas Femininas': '👗',
  'Roupas Masculinas': '👔',
  'Acessórios': '👜',
  'Calçados': '👟',
  'Calças': '👖',
  'Camisas': '👕',
  'Tênis': '👟',
  'Outros': '🛍️',
};

// Imagens de categorias
export const CATEGORY_IMAGES = {
  'roupas-femininas': '/images/categories/roupas-femininas.jpg',
  'roupas-masculinas': '/images/categories/roupas-masculinas.jpg',
  'acessorios': '/images/categories/acessorios.jpg',
  'acessórios': '/images/categories/acessorios.jpg',
  'calcados': '/images/categories/calcados.jpg',
  'calçados': '/images/categories/calcados.jpg',
  'calcas': '/images/categories/calcas.jpg',
  'camisas': '/images/categories/camisas.jpg',
  'tenis': '/images/categories/tenis.jpg',
  'tênnis': '/images/categories/tenis.jpg',
  'outros': '/images/categories/outros.jpg',
};

export const CATEGORY_COLORS = {
  'roupas-femininas': '#FFE5E5',
  'roupas-masculinas': '#E5F2FF',
  'acessorios': '#FFF5E5',
  'acessóricos': '#FFF5E5',
  'calcados': '#F0E5FF',
  'calçados': '#F0E5FF',
  'calcas': '#F5F0FF',
  'camisas': '#FFF0E5',
  'tenis': '#E5F5FF',
  'tênnis': '#E5F5FF',
  'outros': '#FFE5F5',
};

export interface CategoryConfig {
  icon: string;
  image: string;
  color: string;
  slug: string;
  label: string;
}

/**
 * Obter configuração completa de uma categoria
 * @param slug - slug da categoria
 * @param name - nome da categoria (fallback)
 * @returns Configuração com ícone, imagem, cor e informações
 */
export const getCategoryConfig = (
  slug?: string,
  name?: string
): CategoryConfig => {
  const slugKey = slug?.toLowerCase() || '';
  const nameKey = name?.toLowerCase() || '';

  return {
    icon: CATEGORY_ICONS[slugKey] || CATEGORY_ICONS[nameKey] || '🛍️',
    image: CATEGORY_IMAGES[slugKey] || CATEGORY_IMAGES[nameKey] || '/images/categories/outros.jpg',
    color: CATEGORY_COLORS[slugKey] || CATEGORY_COLORS[nameKey] || '#E5F5FF',
    slug: slug || '',
    label: name || 'Categoria',
  };
};

/**
 * Obter apenas o ícone da categoria (emoji)
 */
export const getCategoryIcon = (slug?: string, name?: string): string => {
  const slugKey = slug?.toLowerCase() || '';
  const nameKey = name?.toLowerCase() || '';
  return CATEGORY_ICONS[slugKey] || CATEGORY_ICONS[nameKey] || '🛍️';
};

/**
 * Obter apenas a imagem da categoria
 */
export const getCategoryImage = (slug?: string, name?: string): string => {
  const slugKey = slug?.toLowerCase() || '';
  const nameKey = name?.toLowerCase() || '';
  return CATEGORY_IMAGES[slugKey] || CATEGORY_IMAGES[nameKey] || '/images/categories/outros.jpg';
};

/**
 * Obter apenas a cor da categoria
 */
export const getCategoryColor = (slug?: string, name?: string): string => {
  const slugKey = slug?.toLowerCase() || '';
  const nameKey = name?.toLowerCase() || '';
  return CATEGORY_COLORS[slugKey] || CATEGORY_COLORS[nameKey] || '#E5F5FF';
};

/**
 * Mapper de ícones Lucide React para categorias (alternativa)
 * Use isso se quiser usar ícones do Lucide em vez de emojis
 */
export const CATEGORY_LUCIDE_ICONS = {
  'roupas-femininas': 'Dress',
  'roupas-masculinas': 'Shirt',
  'acessorios': 'Briefcase',
  'acessórios': 'Briefcase',
  'calcados': 'Shoe',
  'calçados': 'Shoe',
  'calcas': 'Pants',
  'camisas': 'ShirtIcon',
  'tenis': 'Shoe',
  'tênnis': 'Shoe',
  'outros': 'ShoppingBag',
};

/**
 * Lista de todas as categorias padrão
 */
export const DEFAULT_CATEGORIES = [
  {
    id: 1,
    nome: 'Roupas Femininas',
    slug: 'roupas-femininas',
    icon: '👗',
    color: '#FFE5E5',
  },
  {
    id: 2,
    nome: 'Roupas Masculinas',
    slug: 'roupas-masculinas',
    icon: '👔',
    color: '#E5F2FF',
  },
  {
    id: 3,
    nome: 'Acessórios',
    slug: 'acessorios',
    icon: '👜',
    color: '#FFF5E5',
  },
  {
    id: 4,
    nome: 'Calçados',
    slug: 'calcados',
    icon: '👟',
    color: '#F0E5FF',
  },
  {
    id: 5,
    nome: 'Calças',
    slug: 'calcas',
    icon: '👖',
    color: '#F5F0FF',
  },
  {
    id: 6,
    nome: 'Camisas',
    slug: 'camisas',
    icon: '👕',
    color: '#FFF0E5',
  },
  {
    id: 7,
    nome: 'Tênis',
    slug: 'tenis',
    icon: '👟',
    color: '#E5F5FF',
  },
  {
    id: 8,
    nome: 'Outros',
    slug: 'outros',
    icon: '🛍️',
    color: '#FFE5F5',
  },
];
