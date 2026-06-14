import type { RequestCouponDetails, RequestRecord } from '@gosource/api-client';

const INVALID_COUPON_CODE_VALUES = new Set(['false', 'true', 'null', 'undefined']);

export function normalizeRequestCouponCode(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || INVALID_COUPON_CODE_VALUES.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed;
}

function normalizeCouponDetails(
  value: RequestCouponDetails | null | undefined,
): RequestCouponDetails | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const code = normalizeRequestCouponCode(value.code);
  if (!code) {
    return null;
  }

  return {
    ...value,
    code,
  };
}

function formatCouponCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCheckoutCouponLabel(
  coupon: RequestCouponDetails | null | undefined,
) {
  const normalized = normalizeCouponDetails(coupon);
  if (!normalized) {
    return null;
  }

  if (normalized.type === 'FREE_DELIVERY') {
    return `${normalized.code} · Free delivery`;
  }

  if (normalized.type === 'PERCENTAGE') {
    return `${normalized.code} · -${normalized.discount}%`;
  }

  return `${normalized.code} · -${formatCouponCurrency(normalized.discount)}`;
}

export function resolveCheckoutCouponLabel(
  request: Pick<RequestRecord, 'coupon' | 'couponCode' | 'couponDetails'> | null | undefined,
) {
  if (!request) {
    return null;
  }

  const fromDetails = formatCheckoutCouponLabel(request.couponDetails);
  if (fromDetails) {
    return fromDetails;
  }

  const code = normalizeRequestCouponCode(request.couponCode);
  return code;
}

export function hasCheckoutCouponApplied(input: {
  coupon?: boolean;
  couponCode?: string | null;
  couponDetails?: RequestCouponDetails | null;
}) {
  if (input.coupon === true) {
    return true;
  }

  return Boolean(
    normalizeRequestCouponCode(input.couponCode) ||
      formatCheckoutCouponLabel(input.couponDetails),
  );
}

export function checkoutCouponDisplayLabel(
  label: string | null | undefined,
  applied?: boolean,
) {
  if (typeof label === 'string' && label.trim()) {
    return label.trim();
  }

  return applied ? 'Coupon applied' : 'Apply coupon code';
}
