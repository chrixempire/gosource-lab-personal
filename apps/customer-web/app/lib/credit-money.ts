export function koboToNaira(kobo: number | null | undefined) {
  if (kobo == null || Number.isNaN(Number(kobo))) {
    return 0;
  }
  return Number(kobo) / 100;
}

export function formatCreditFromKobo(kobo: number | null | undefined) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(koboToNaira(kobo));
}
