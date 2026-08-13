export function parsePriceToNumber(priceText: string): number {
  const normalized = priceText.replace(/[^0-9.-]/g, '');
  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? 0 : value;
}

export function formatNumberToPrice(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}
