const mojibakePatterns: Array<[RegExp, string]> = [
  [/Ã¡/g, 'á'],
  [/Ã /g, 'à'],
  [/Ã¢/g, 'â'],
  [/Ã£/g, 'ã'],
  [/Ã¤/g, 'ä'],
  [/Ã©/g, 'é'],
  [/Ãª/g, 'ê'],
  [/Ã¨/g, 'è'],
  [/Ã­/g, 'í'],
  [/Ã³/g, 'ó'],
  [/Ã´/g, 'ô'],
  [/Ãµ/g, 'õ'],
  [/Ãº/g, 'ú'],
  [/Ã§/g, 'ç'],
  [/Ã±/g, 'ñ'],
  [/â€“/g, '–'],
  [/â€”/g, '—'],
  [/â€˜|â€™/g, '’'],
  [/â€œ|â€/g, '”'],
  [/â€¢/g, '•'],
  [/Â/g, ''],
];

export const sanitizeText = (value?: string | null): string => {
  const text = String(value ?? '');

  if (!text.includes('Ã') && !text.includes('Â') && !text.includes('â€')) {
    return text;
  }

  return mojibakePatterns.reduce((acc, [pattern, replacement]) => {
    return acc.replace(pattern, replacement);
  }, text);
};
