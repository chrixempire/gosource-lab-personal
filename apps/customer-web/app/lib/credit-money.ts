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

/** jsPDF cannot render the Naira glyph from Intl currency formatting — use ASCII prefix. */
export function formatCreditAmountForInvoice(kobo: number | null | undefined) {
  const naira = koboToNaira(kobo);
  return `NGN ${naira.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
