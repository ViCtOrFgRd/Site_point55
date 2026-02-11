/**
 * Mapeamento de cores para valores hexadecimais
 * Suporta cores simples e variações com múltiplas cores
 */

// Mapa de cores básicas em português
const colorMap: Record<string, string> = {
  // Cores básicas
  'Preto': '#000000',
  'Branco': '#FFFFFF',
  'Cinza': '#808080',
  'Cinza-claro': '#D3D3D3',
  'Cinza-escuro': '#404040',
  'Azul': '#0066CC',
  'Azul-claro': '#87CEEB',
  'Azul-escuro': '#00008B',
  'Vermelho': '#FF0000',
  'Vermelho-escuro': '#8B0000',
  'Verde': '#008000',
  'Verde-claro': '#90EE90',
  'Verde-escuro': '#006400',
  'Amarelo': '#FFFF00',
  'Laranja': '#FFA500',
  'Rosa': '#FFC0CB',
  'Rosa-escuro': '#DB7093',
  'Roxo': '#800080',
  'Marrom': '#8B4513',
  'Bege': '#F5F5DC',
  'Ouro': '#FFD700',
  'Prata': '#C0C0C0',
  'Turquesa': '#40E0D0',
  'Teal': '#008080',
  'Coral': '#FF7F50',
  'Khaki': '#F0E68C',
  'Salmon': '#FA8072',
  'Chocolate': '#D2691E',
};

const normalizeColorKey = (value: string): string => value.trim().toLowerCase();

const colorMapNormalized: Record<string, string> = Object.entries(colorMap).reduce(
  (acc, [key, hex]) => {
    acc[normalizeColorKey(key)] = hex;
    return acc;
  },
  {} as Record<string, string>
);

const getHexForColor = (value: string): string => {
  const normalized = normalizeColorKey(value);
  return colorMapNormalized[normalized] || '#CCCCCC';
};

const formatColorLabel = (value: string): string => {
  const trim = value.trim();
  if (!trim) return '';
  return trim
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join('-');
};

/**
 * Converte um nome de cor para valor hexadecimal
 * Suporta cores simples e combinações com "/"
 * Ex: "Preto", "Branco/Azul", "Vermelho/Amarelo"
 */
export const convertColorToHex = (colorName: string): string => {
  if (!colorName) return '#CCCCCC';

  // Remover espaços extras
  const trimmed = colorName.trim();

  // Se for uma combinação de cores (com "/")
  if (trimmed.includes('/')) {
    return `linear-gradient(135deg, ${getGradientColors(trimmed)})`;
  }

  // Se for uma cor única
  return getHexForColor(trimmed) || `linear-gradient(135deg, ${colorMap['Cinza']}, ${colorMap['Cinza-claro']})`;
};

/**
 * Obtém cores do gradiente a partir de uma string com "/"
 * Ex: "Branco/Azul" retorna "cores para gradiente"
 */
const getGradientColors = (colorString: string): string => {
  const parts = colorString.split('/').map((c) => c.trim());
  const hexColors = parts.map((c) => getHexForColor(c));

  if (hexColors.length === 2) {
    return `${hexColors[0]}, ${hexColors[1]}`;
  } else if (hexColors.length > 2) {
    return hexColors.join(', ');
  }

  return `${hexColors[0]}, ${hexColors[0]}`;
};

/**
 * Obtém a cor de fundo CSS para um nome de cor
 * Para gradientes, retorna a cor dominante (primeira cor)
 */
export const getColorBackground = (colorName: string): string => {
  if (!colorName) return '#CCCCCC';

  const trimmed = colorName.trim();

  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map((c) => c.trim());
    return getHexForColor(parts[0]);
  }

  return getHexForColor(trimmed);
};

/**
 * Obtém uma descri ção visual da cor para exibição
 */
export const getColorLabel = (colorName: string): string => {
  const trimmed = colorName.trim();

  if (trimmed.includes('/')) {
    const parts = trimmed
      .split('/')
      .map((c) => formatColorLabel(c));
    return `${parts.join(' e ')} (Meio-a-meio)`;
  }

  return formatColorLabel(trimmed);
};

/**
 * Retorna todas as cores disponíveis no mapa
 */
export const getAllAvailableColors = (): string[] => {
  return Object.keys(colorMap);
};

/**
 * Cria um padrão visual para variações com múltiplas cores
 * Retorna um style object CSS
 */
export const getColorVariationStyle = (
  colorName: string
): React.CSSProperties => {
  const hex = convertColorToHex(colorName);

  if (hex.startsWith('linear-gradient')) {
    return {
      background: hex,
      backgroundSize: '200% 200%',
      position: 'relative',
    } as React.CSSProperties;
  }

  return {
    backgroundColor: hex,
  };
};

export default colorMap;
