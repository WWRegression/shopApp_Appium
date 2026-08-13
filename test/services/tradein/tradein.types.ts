export type TradeInStep =
  | 'guide'
  | 'select-device'
  | 'check-condition'
  | 'enter-imei'
  | 'apply-discount'
  | 'unknown';

export interface TradeInInput {
  brand?: string;
  category?: string;
  model?: string;
  subseries?: string;
  device?: string;
  storage?: string;
  color?: string;
  screenSize?: string;
  imei?: string;
  zipCode?: string;
  purchaseFrom?: string;
}

export function mapCloseAttributeToStep(anLa: string | null | undefined): TradeInStep {
  const value = (anLa ?? '').toLowerCase();
  if (value.includes('guide')) return 'guide';
  if (value.includes('select device') || value.includes('brand and device')) {
    return 'select-device';
  }
  if (value.includes('condition')) return 'check-condition';
  if (value.includes('imei')) return 'enter-imei';
  if (value.includes('apply') || value.includes('discount')) return 'apply-discount';
  if (value === 'trade-in:close') return 'select-device';
  return 'unknown';
}
