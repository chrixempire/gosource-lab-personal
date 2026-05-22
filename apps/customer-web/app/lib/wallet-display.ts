import type { WalletRecord } from '@gosource/api-client';

/** Display wallet account fields as returned by the API (matches gosource-web-app). */
export function formatWalletAccountDisplay(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return String(value);
}

export function isWalletVirtualAccountPending(wallet: WalletRecord | null | undefined) {
  if (!wallet) {
    return true;
  }

  const accountName = formatWalletAccountDisplay(wallet.accountName);
  const accountNumber = formatWalletAccountDisplay(wallet.accountNumber);
  const bankName = formatWalletAccountDisplay(wallet.bankName);

  return (
    accountName === 'Loading...' ||
    bankName === 'Loading...' ||
    !accountNumber ||
    accountNumber === '0'
  );
}

export function canCopyWalletAccountNumber(wallet: WalletRecord | null | undefined) {
  if (!wallet || isWalletVirtualAccountPending(wallet)) {
    return false;
  }

  const accountNumber = formatWalletAccountDisplay(wallet.accountNumber).trim();
  return accountNumber.length > 0 && accountNumber !== '0';
}

export function maskPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return phone.trim() || 'your phone';
  }

  return `ending ${digits.slice(-4)}`;
}

export function validateWalletBvn(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return 'BVN is required';
  }
  if (digits.length !== 11) {
    return 'BVN must be 11 digits';
  }
  return '';
}

/** Strip formatting and return whole-naira amount for API calls. */
export function parseNairaAmountInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return Number.NaN;
  }
  return Number(digits);
}

/** Format typed digits with grouping (e.g. 150000 → 150,000). */
export function formatNairaAmountInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  return Number(digits).toLocaleString('en-NG');
}

export function formatNairaAmountLabel(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

const ONES_BELOW_TWENTY = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
] as const;

const TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
] as const;

const SCALE_UNITS = ['', 'thousand', 'million', 'billion', 'trillion'] as const;

function joinWords(parts: string[]) {
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function convertHundreds(value: number): string {
  if (value <= 0) {
    return '';
  }

  if (value < 20) {
    return ONES_BELOW_TWENTY[value] ?? '';
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const remainder = value % 10;
    return joinWords([TENS[tens] ?? '', remainder ? (ONES_BELOW_TWENTY[remainder] ?? '') : '']);
  }

  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  return joinWords([
    `${ONES_BELOW_TWENTY[hundreds] ?? ''} hundred`,
    remainder ? convertHundreds(remainder) : '',
  ]);
}

function convertWholeNumber(value: number): string {
  if (value === 0) {
    return ONES_BELOW_TWENTY[0] ?? '';
  }

  let remaining = Math.floor(value);
  const parts: string[] = [];
  let scaleIndex = 0;

  while (remaining > 0 && scaleIndex < SCALE_UNITS.length) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const scale = SCALE_UNITS[scaleIndex] ?? '';
      parts.unshift(joinWords([convertHundreds(chunk), scale]));
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }

  return joinWords(parts);
}

/** e.g. 50000 → "Fifty thousand naira" */
export function formatNairaAmountInWords(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }

  const whole = Math.floor(value);
  if (whole > Number.MAX_SAFE_INTEGER) {
    return '';
  }

  const words = convertWholeNumber(whole);
  if (!words) {
    return '';
  }

  return `${words.charAt(0).toUpperCase()}${words.slice(1)} naira`;
}
