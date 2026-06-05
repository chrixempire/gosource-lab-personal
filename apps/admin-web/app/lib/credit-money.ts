import { formatDashboardCurrency } from '~/lib/dashboard-date';

/** Legacy credit amounts are stored in kobo; admin forms and DTOs use naira. */
export function koboToNaira(kobo: number | null | undefined) {
  if (kobo == null || Number.isNaN(Number(kobo))) {
    return 0;
  }
  return Number(kobo) / 100;
}

export function formatCreditFromKobo(kobo: number | null | undefined) {
  return formatDashboardCurrency(koboToNaira(kobo));
}

export function nairaToNumber(value: string | number | null | undefined) {
  if (value == null || value === '') {
    return 0;
  }
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sanitizeFormattedNumberInput(value: string, allowDecimal = false) {
  const sanitized = value.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '');

  if (!allowDecimal) {
    return sanitized;
  }

  const [whole, ...decimals] = sanitized.split('.');
  const decimalPart = decimals.join('');
  return decimalPart ? `${whole}.${decimalPart.slice(0, 2)}` : whole;
}

export function formatFormattedNumberInput(value: string, allowDecimal = false) {
  if (!value) {
    return '';
  }

  if (allowDecimal) {
    const [whole = '', decimal = ''] = value.split('.');
    const formattedWhole = Number(whole || 0).toLocaleString('en-NG');
    return decimal ? `${formattedWhole}.${decimal}` : formattedWhole;
  }

  return Number(value).toLocaleString('en-NG');
}

export function formatNairaInputDisplay(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return '';
  }

  return formatFormattedNumberInput(String(value), false);
}
