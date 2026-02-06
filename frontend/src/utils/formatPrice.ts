/**
 * Converte preço para número (PostgreSQL DECIMAL retorna como string)
 */
export function toNumber(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

/**
 * Formata preço para exibição (R$ 1.234,56)
 */
export function formatPrice(value: number | string | undefined | null): string {
  const num = toNumber(value);
  return num.toFixed(2).replace('.', ',');
}

/**
 * Formata preço completo com símbolo (R$ 1.234,56)
 */
export function formatPriceWithSymbol(value: number | string | undefined | null): string {
  return `R$ ${formatPrice(value)}`;
}
