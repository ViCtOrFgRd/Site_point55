/**
 * Mapeamento de cores para valores hexadecimais
 * Suporta cores simples e variações com múltiplas cores
 */

const colorMap: Record<string, string> = {
  'Preto': '#000000',
  'Triple Black': '#050505',
  'Tiple Black': '#050505',
  'Blackout': '#060606',
  'Branco': '#FFFFFF',
  'Off-white': '#F8F8F2',
  'Off White': '#F8F8F2',
  'Offwhite': '#F8F8F2',
  'Offwhite Premium': '#F7F6F2',
  'Gelo': '#F4F7F8',
  'Creme': '#FFF5E1',
  'Cinza': '#808080',
  'Cinza-claro': '#D3D3D3',
  'Cinza-escuro': '#404040',
  'Grafite': '#424242',
  'Chumbo': '#3B3E45',
  'Azul': '#0066CC',
  'Azul-claro': '#87CEEB',
  'Azul-escuro': '#00008B',
  'Azul-marinho': '#0A2463',
  'Marinho': '#0A2463',
  'Jeans': '#3A6EA5',
  'Vermelho': '#FF0000',
  'Vermelho-escuro': '#8B0000',
  'Vinho': '#722F37',
  'Bordo': '#800020',
  'Verde': '#008000',
  'Verde-claro': '#90EE90',
  'Verde-escuro': '#006400',
  'Oliva': '#808000',
  'Musgo': '#6B8E23',
  'Amarelo': '#FFFF00',
  'Laranja': '#FFA500',
  'Rosa': '#FFC0CB',
  'Rosa-escuro': '#DB7093',
  'Nude': '#E3BC9A',
  'Pele': '#F1C27D',
  'Roxo': '#800080',
  'Lilás': '#C8A2C8',
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

const officialColorNames: string[] = [
  'preto',
  'branco',
  'off white',
  'triple black',
  'cinza',
  'grafite',
  'chumbo',
  'azul',
  'azul marinho',
  'jeans',
  'verde',
  'verde oliva',
  'verde musgo',
  'vermelho',
  'vinho',
  'bordo',
  'amarelo',
  'laranja',
  'rosa',
  'roxo',
  'lilás',
  'marrom',
  'bege',
  'nude',
  'prata',
  'ouro',
  'turquesa',
  'teal',
  'coral',
  'khaki',
  'salmon',
  'chocolate',
];

const colorAliases: Record<string, string> = {
  'white': '#FFFFFF',
  'black': '#000000',
  'triple-black': '#050505',
  'triple black': '#050505',
  'tiple-black': '#050505',
  'tiple black': '#050505',
  'blackout': '#060606',
  'all-black': '#050505',
  'all black': '#050505',
  'total-black': '#050505',
  'total black': '#050505',
  'gray': '#808080',
  'grey': '#808080',
  'light-gray': '#D3D3D3',
  'dark-gray': '#404040',
  'blue': '#0066CC',
  'light-blue': '#87CEEB',
  'dark-blue': '#00008B',
  'navy': '#0A2463',
  'red': '#FF0000',
  'green': '#008000',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'pink': '#FFC0CB',
  'purple': '#800080',
  'brown': '#8B4513',
  'beige': '#F5F5DC',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'nude': '#E3BC9A',
  'off-white': '#F8F8F2',
  'offwhite': '#F8F8F2',
  'off white': '#F8F8F2',
  'offwhite premium': '#F7F6F2',
  'azul-marinho': '#0A2463',
  'azul marinho': '#0A2463',
  'cinza claro': '#D3D3D3',
  'cinza escuro': '#404040',
};

const normalizeColorKey = (value: string): string => value
  .trim()
  .replace(/@\s*\d{1,3}\s*%?$/i, '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/_/g, '-')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const cleanColorToken = (value: string): string =>
  String(value || '')
    .trim()
    .replace(/^[\[\]{}()"']+|[\[\]{}()"']+$/g, '')
    .replace(/^cor\s*[:=-]?\s*/i, '')
    .replace(/^color\s*[:=-]?\s*/i, '')
    .trim();

const stripDominanceSuffix = (value: string): string =>
  cleanColorToken(value).replace(/@\s*\d{1,3}\s*%?$/i, '').trim();

const extractDominancePercent = (value: string): number | null => {
  const match = cleanColorToken(value).match(/@\s*(\d{1,3})\s*%?$/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) return null;
  return clamp(parsed, 50, 90);
};

const isHexColor = (value: string) => /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(value.trim());
const isRgbOrHsl = (value: string) => /^(rgb|rgba|hsl|hsla)\(/i.test(value.trim());

const normalizeHexColor = (value: string): string => {
  const hex = value.trim();
  if (!isHexColor(hex)) return hex;
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase();
  }
  return hex.toUpperCase();
};

const splitColorTokens = (value: string): string[] =>
  String(value || '')
    .split(/\s+e\s+|\s+com\s+|\s+c\/\s*|[\\/,;|+]+/gi)
    .map((token) => stripDominanceSuffix(token))
    .filter(Boolean);

const splitBySlash = (value: string): string[] =>
  String(value || '')
    .split(/[\\/]/)
    .map((token) => stripDominanceSuffix(token))
    .filter(Boolean);

type HslColor = { h: number; s: number; l: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const baseColorFamilies: Array<{ tokens: string[]; hsl: HslColor }> = [
  { tokens: ['preto', 'black', 'grafite', 'chumbo', 'carbon', 'onix', 'onix'], hsl: { h: 220, s: 8, l: 12 } },
  { tokens: ['branco', 'white', 'off-white', 'offwhite', 'gelo', 'neve'], hsl: { h: 210, s: 12, l: 95 } },
  { tokens: ['cinza', 'gray', 'grey', 'prata', 'silver'], hsl: { h: 215, s: 8, l: 58 } },
  { tokens: ['azul', 'blue', 'marinho', 'navy', 'royal', 'jeans'], hsl: { h: 218, s: 72, l: 48 } },
  { tokens: ['verde', 'green', 'oliva', 'musgo', 'militar', 'esmeralda', 'mint'], hsl: { h: 136, s: 56, l: 42 } },
  { tokens: ['vermelho', 'red', 'vinho', 'bordo', 'marsala', 'cereja'], hsl: { h: 356, s: 74, l: 50 } },
  { tokens: ['amarelo', 'yellow', 'mostarda'], hsl: { h: 48, s: 85, l: 52 } },
  { tokens: ['laranja', 'orange', 'coral', 'terracota'], hsl: { h: 26, s: 82, l: 55 } },
  { tokens: ['rosa', 'pink', 'fucsia', 'fuchsia', 'magenta'], hsl: { h: 330, s: 72, l: 62 } },
  { tokens: ['roxo', 'purple', 'lilas', 'violeta', 'lavanda'], hsl: { h: 274, s: 58, l: 54 } },
  { tokens: ['marrom', 'brown', 'bege', 'beige', 'nude', 'areia', 'caqui', 'khaki', 'caramelo'], hsl: { h: 30, s: 38, l: 54 } },
  { tokens: ['turquesa', 'teal', 'ciano', 'cyan', 'agua', 'aqua'], hsl: { h: 182, s: 66, l: 48 } },
];

const toneModifiers = {
  light: new Set(['claro', 'light', 'pastel', 'suave', 'bebê', 'bebe']),
  dark: new Set(['escuro', 'dark', 'deep', 'intenso', 'triple', 'double', 'duplo', 'ultra', 'total']),
  vivid: new Set(['vivo', 'vibrante', 'vibrant']),
  neon: new Set(['neon', 'fluor', 'fluorescente']),
  matte: new Set(['fosco', 'opaco', 'matte']),
  metallic: new Set(['metalico', 'metálico', 'cromado', 'perolado']),
};

const tokenizeNormalized = (value: string): string[] =>
  normalizeColorKey(cleanColorToken(value))
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean);

const levenshteinDistance = (left: string, right: string): number => {
  const a = left;
  const b = right;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));

  for (let index = 0; index <= a.length; index += 1) matrix[index][0] = index;
  for (let index = 0; index <= b.length; index += 1) matrix[0][index] = index;

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const similarityRatio = (left: string, right: string): number => {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const maxLength = Math.max(left.length, right.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(left, right);
  return 1 - distance / maxLength;
};

const tokenMatchesFuzzy = (inputToken: string, referenceToken: string): boolean => {
  if (inputToken === referenceToken) return true;
  if (inputToken.includes(referenceToken) || referenceToken.includes(inputToken)) {
    return Math.min(inputToken.length, referenceToken.length) >= 3;
  }

  const ratio = similarityRatio(inputToken, referenceToken);
  if (referenceToken.length <= 4) return ratio >= 0.78;
  if (referenceToken.length <= 7) return ratio >= 0.72;
  return ratio >= 0.68;
};

const bestFuzzyMapMatch = (normalizedValue: string): string | null => {
  const candidates = [...Object.entries(colorMapNormalized), ...Object.entries(aliasMapNormalized)];
  const inputTokens = normalizedValue.split('-').filter(Boolean);

  let bestHex: string | null = null;
  let bestScore = 0;

  for (const [key, hex] of candidates) {
    const keyTokens = key.split('-').filter(Boolean);
    const globalScore = similarityRatio(normalizedValue, key);

    let tokenScore = 0;
    if (inputTokens.length > 0 && keyTokens.length > 0) {
      const matches = inputTokens.reduce((acc, inputToken) => {
        const hasMatch = keyTokens.some((keyToken) => tokenMatchesFuzzy(inputToken, keyToken));
        return acc + (hasMatch ? 1 : 0);
      }, 0);
      tokenScore = matches / inputTokens.length;
    }

    const score = Math.max(globalScore, tokenScore * 0.95);
    if (score > bestScore) {
      bestScore = score;
      bestHex = hex;
    }
  }

  return bestScore >= 0.7 ? bestHex : null;
};

const inferColorByKeywords = (value: string): string | null => {
  const normalized = normalizeColorKey(cleanColorToken(value));
  if (!normalized) return null;

  const tokens = normalized.split('-').filter(Boolean);
  const matchedFamilies = baseColorFamilies
    .map((family) => {
      const familyTokens = family.tokens.map((token) => normalizeColorKey(token));
      const score = tokens.reduce((acc, token) => {
        const localBest = familyTokens.reduce((best, familyToken) => {
          if (tokenMatchesFuzzy(token, familyToken)) {
            return Math.max(best, similarityRatio(token, familyToken));
          }
          return best;
        }, 0);
        return acc + localBest;
      }, 0);

      const normalizedScore = tokens.length > 0 ? score / tokens.length : 0;
      return { family, score: normalizedScore };
    })
    .filter(({ score }) => score >= 0.45)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map(({ family }) => family);

  if (matchedFamilies.length === 0) return null;

  const base = matchedFamilies.reduce(
    (acc, family) => {
      acc.h += family.hsl.h;
      acc.s += family.hsl.s;
      acc.l += family.hsl.l;
      return acc;
    },
    { h: 0, s: 0, l: 0 }
  );

  let h = Math.round(base.h / matchedFamilies.length);
  let s = Math.round(base.s / matchedFamilies.length);
  let l = Math.round(base.l / matchedFamilies.length);

  if (tokens.some((token) => toneModifiers.light.has(token))) {
    l += 16;
    s -= 8;
  }

  if (tokens.some((token) => toneModifiers.dark.has(token))) {
    l -= 16;
    s += 4;
  }

  if (tokens.some((token) => toneModifiers.vivid.has(token))) {
    s += 10;
  }

  if (tokens.some((token) => toneModifiers.neon.has(token))) {
    s += 18;
    l += 6;
  }

  if (tokens.some((token) => toneModifiers.matte.has(token))) {
    s -= 14;
    l -= 4;
  }

  if (tokens.some((token) => toneModifiers.metallic.has(token))) {
    s -= 20;
    l += 8;
  }

  s = clamp(s, 8, 96);
  l = clamp(l, 8, 96);

  return `hsl(${h} ${s}% ${l}%)`;
};

const getDeterministicFallbackColor = (value: string): string => {
  const seed = normalizeColorKey(cleanColorToken(value));
  if (!seed) return '#9CA3AF';

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 58% 52%)`;
};

const colorMapNormalized: Record<string, string> = Object.entries(colorMap).reduce(
  (acc, [key, hex]) => {
    acc[normalizeColorKey(key)] = hex;
    return acc;
  },
  {} as Record<string, string>
);

const aliasMapNormalized: Record<string, string> = Object.entries(colorAliases).reduce(
  (acc, [key, hex]) => {
    acc[normalizeColorKey(key)] = hex;
    return acc;
  },
  {} as Record<string, string>
);

const getHexForColor = (value: string): string => {
  const trimmed = stripDominanceSuffix(value);
  if (!trimmed) return '#CCCCCC';

  if (isHexColor(trimmed)) {
    return normalizeHexColor(trimmed);
  }

  if (isRgbOrHsl(trimmed)) {
    return trimmed;
  }

  const normalized = normalizeColorKey(trimmed);
  const mapped = colorMapNormalized[normalized] || aliasMapNormalized[normalized];
  if (mapped) return mapped;

  const fuzzyMapped = bestFuzzyMapMatch(normalized);
  if (fuzzyMapped) return fuzzyMapped;

  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', trimmed)) {
    return trimmed;
  }

  const fragments = normalized.split('-').filter(Boolean);
  for (const fragment of fragments) {
    const byFragment = colorMapNormalized[fragment] || aliasMapNormalized[fragment];
    if (byFragment) {
      return byFragment;
    }
  }

  for (const fragment of fragments) {
    const fuzzyFragment = bestFuzzyMapMatch(fragment);
    if (fuzzyFragment) {
      return fuzzyFragment;
    }
  }

  const inferred = inferColorByKeywords(trimmed);
  if (inferred) {
    return inferred;
  }

  return getDeterministicFallbackColor(trimmed);
};

const formatColorLabel = (value: string): string => {
  const trim = stripDominanceSuffix(value);
  if (!trim) return '';
  return trim.toLowerCase();
};

export const extractColorOptions = (colors: string[] = []): string[] => {
  const parsed = colors
    .flatMap((raw) =>
      String(raw || '')
        .split(/[,;|+]+/gi)
        .map((token) => cleanColorToken(token))
        .filter(Boolean)
    )
    .map((color) => color.trim())
    .filter(Boolean);

  return Array.from(
    new Map(parsed.map((color) => [normalizeColorKey(color), color])).values()
  );
};

/**
 * Converte um nome de cor para valor hexadecimal
 * Suporta cores simples e combinações com "/"
 * Ex: "Preto", "Branco/Azul", "Vermelho/Amarelo"
 */
export const convertColorToHex = (colorName: string): string => {
  if (!colorName) return '#CCCCCC';

  const raw = cleanColorToken(colorName.trim());
  const dominancePercent = extractDominancePercent(raw);
  const baseRaw = stripDominanceSuffix(raw);
  const slashParts = splitBySlash(baseRaw);

  if (slashParts.length >= 2) {
    const first = getHexForColor(slashParts[0]);
    const second = getHexForColor(slashParts[1]);
    const firstShare = clamp(dominancePercent ?? 68, 50, 90);

    // Regra de negócio: primeira cor predominante, segunda secundária
    if (slashParts.length === 2) {
      return `linear-gradient(90deg, ${first} 0%, ${first} ${firstShare}%, ${second} ${firstShare}%, ${second} 100%)`;
    }

    // Para 3+ cores com '/', mantém a primeira predominante e distribui o restante
    const rest = slashParts.slice(1).map((part) => getHexForColor(part));
    const startRest = firstShare;
    const segment = (100 - startRest) / rest.length;
    const stops = rest
      .map((color, index) => {
        const start = startRest + segment * index;
        const end = startRest + segment * (index + 1);
        return `${color} ${start}%, ${color} ${end}%`;
      })
      .join(', ');

    return `linear-gradient(90deg, ${first} 0%, ${first} ${startRest}%, ${stops})`;
  }

  const parts = splitColorTokens(baseRaw);

  if (parts.length > 1) {
    return `linear-gradient(135deg, ${parts.map((part) => getHexForColor(part)).join(', ')})`;
  }

  return getHexForColor(parts[0] || baseRaw) || '#CCCCCC';
};

/**
 * Obtém a cor de fundo CSS para um nome de cor
 * Para gradientes, retorna a cor dominante (primeira cor)
 */
export const getColorBackground = (colorName: string): string => {
  if (!colorName) return '#CCCCCC';

  const parts = splitColorTokens(colorName.trim());
  return getHexForColor(parts[0] || colorName.trim());
};

/**
 * Obtém uma descrição visual da cor para exibição
 */
export const getColorLabel = (colorName: string): string => {
  const trimmed = cleanColorToken(String(colorName || ''));
  const slashParts = splitBySlash(trimmed);

  if (slashParts.length > 1) {
    return slashParts.map((part) => formatColorLabel(part)).join('/');
  }

  const parts = splitColorTokens(trimmed);

  if (parts.length > 1) {
    return `${parts.map((part) => formatColorLabel(part)).join(' e ')} (Combinado)`;
  }

  return formatColorLabel(parts[0] || trimmed);
};

/**
 * Retorna todas as cores disponíveis no mapa
 */
export const getAllAvailableColors = (): string[] => {
  return Array.from(new Set([...Object.keys(colorMap), ...Object.keys(colorAliases)]));
};

export const getOfficialColorNames = (): string[] => {
  return officialColorNames;
};

const parseHexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!isHexColor(hex)) return null;
  const normalized = normalizeHexColor(hex).replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const parseRgbString = (value: string): { r: number; g: number; b: number } | null => {
  const match = value.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  return {
    r: Math.min(255, Number(match[1])),
    g: Math.min(255, Number(match[2])),
    b: Math.min(255, Number(match[3])),
  };
};

const parseHslString = (value: string): { r: number; g: number; b: number } | null => {
  const match = value.match(/hsla?\(([-\d.]+)(deg)?\s*[\s,/]\s*([\d.]+)%\s*[\s,/]\s*([\d.]+)%/i);
  if (!match) return null;

  const hue = ((Number(match[1]) % 360) + 360) % 360;
  const saturation = clamp(Number(match[3]) / 100, 0, 1);
  const lightness = clamp(Number(match[4]) / 100, 0, 1);

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondComponent = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const matchLightness = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = secondComponent;
  } else if (hue < 120) {
    red = secondComponent;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = secondComponent;
  } else if (hue < 240) {
    green = secondComponent;
    blue = chroma;
  } else if (hue < 300) {
    red = secondComponent;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondComponent;
  }

  return {
    r: Math.round((red + matchLightness) * 255),
    g: Math.round((green + matchLightness) * 255),
    b: Math.round((blue + matchLightness) * 255),
  };
};

const isLightColor = (color: string): boolean => {
  const rgb = parseHexToRgb(color) || parseRgbString(color) || parseHslString(color);
  if (!rgb) return false;
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness >= 180;
};

/**
 * Cria um padrão visual para variações com múltiplas cores
 * Retorna um style object CSS
 */
export const getColorVariationStyle = (
  colorName: string
): React.CSSProperties => {
  const color = convertColorToHex(colorName);
  const backgroundBase = getColorBackground(colorName);
  const light = isLightColor(backgroundBase);
  const checkColor = light ? '#111111' : '#FFFFFF';
  const ringColor = light ? 'rgba(17, 24, 39, 0.28)' : 'rgba(255, 255, 255, 0.25)';

  if (color.startsWith('linear-gradient')) {
    return {
      background: color,
      backgroundImage: color,
      backgroundColor: backgroundBase,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      position: 'relative',
      boxShadow: `0 0 0 1px #000, inset 0 0 0 1px ${ringColor}`,
      ['--swatch-check-color' as string]: checkColor,
    } as React.CSSProperties;
  }

  return {
    backgroundColor: color,
    boxShadow: `0 0 0 1px #000, inset 0 0 0 1px ${ringColor}`,
    ['--swatch-check-color' as string]: checkColor,
  };
};

export default colorMap;
