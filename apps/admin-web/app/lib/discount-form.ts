import { DISCOUNT_ROUTE_SLUGS } from '~/lib/discount-constants';
import {
  formatFormattedNumberInput,
  formatNairaInputDisplay,
  nairaToNumber,
} from '~/lib/credit-money';
import { unwrapInventoryData } from '~/lib/inventory-api';
import { resolveCategoryId } from '~/lib/product-details';
import type { LegacyProductRow } from '~/types/inventory';
import type { DiscountFormValues, DiscountRouteSlug, LegacyCouponRow } from '~/types/discounts';

function parseDiscountNumber(value: string) {
  return nairaToNumber(value);
}

export function createEmptyDiscountFormValues(): DiscountFormValues {
  return {
    code: '',
    discountType: 'FIXED_AMOUNT',
    amount: '',
    categoryId: '',
    productIds: [],
    minOrderAmount: '',
    usageLimit: '',
    target: 'all',
    startDate: '',
    startTime: '00:00',
    hasExpiry: false,
    endDate: '',
    endTime: '23:59',
  };
}

function mergeDateTime(date: string, time: string) {
  if (!date) {
    return null;
  }
  return new Date(`${date}T${time || '00:00'}:00.000Z`).toISOString();
}

function splitDateTime(iso?: string | null) {
  if (!iso) {
    return { date: '', time: '00:00' };
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '00:00' };
  }
  const date = parsed.toISOString().slice(0, 10);
  const time = parsed.toISOString().slice(11, 16);
  return { date, time };
}

export function mapCouponToFormValues(coupon: LegacyCouponRow): DiscountFormValues {
  const start = splitDateTime(coupon.startDate);
  const end = splitDateTime(coupon.endDate ?? coupon.expiryDate);
  const isCategoryCoupon = coupon.category === 'amount_off_category';

  return {
    code: coupon.code ?? '',
    discountType:
      coupon.type === 'FREE_DELIVERY' ? 'FREE_DELIVERY' : (coupon.type ?? 'FIXED_AMOUNT'),
    amount:
      coupon.type === 'PERCENTAGE'
        ? String(coupon.discount ?? '')
        : formatNairaInputDisplay(coupon.discount ?? 0),
    categoryId: coupon.categoryId ? String(coupon.categoryId) : '',
    productIds: isCategoryCoupon ? [] : [...(coupon.applicableItems ?? [])],
    minOrderAmount: formatNairaInputDisplay(coupon.minimumOrderAmount ?? 0),
    usageLimit:
      coupon.usageLimit != null
        ? formatFormattedNumberInput(String(coupon.usageLimit), false)
        : '',
    target: coupon.target ?? 'all',
    startDate: start.date,
    startTime: start.time,
    hasExpiry: Boolean(coupon.endDate ?? coupon.expiryDate),
    endDate: end.date,
    endTime: end.time,
  };
}

/** Resolve category for legacy coupons that only stored product ids in applicableItems. */
export async function resolveDiscountCategoryId(coupon: LegacyCouponRow): Promise<string> {
  if (coupon.categoryId) {
    return String(coupon.categoryId);
  }

  if (coupon.category !== 'amount_off_category') {
    return '';
  }

  const productId = coupon.applicableItems?.find((id) => String(id).trim());
  if (!productId) {
    return '';
  }

  try {
    const payload = await $fetch<unknown>(`/api/products/${productId}`);
    const product = unwrapInventoryData(payload) as LegacyProductRow | null;
    if (!product) {
      return '';
    }
    return resolveCategoryId(product.category) ?? '';
  } catch {
    return '';
  }
}

export function validateDiscountForm(
  values: DiscountFormValues,
  slug: DiscountRouteSlug,
) {
  const errors: Record<string, string> = {};

  if (!values.startDate) {
    errors.startDate = 'Start date is required';
  }
  if (!values.target) {
    errors.target = 'Select a target audience';
  }
  if (values.hasExpiry && !values.endDate) {
    errors.endDate = 'End date is required when expiry is enabled';
  }

  if (slug === 'freeDelivery') {
    const usageLimit = parseDiscountNumber(values.usageLimit);
    if (!usageLimit || usageLimit <= 0) {
      errors.usageLimit = 'Usage limit is required';
    }
    return errors;
  }

  if (!values.discountType) {
    errors.discountType = 'Select a discount type';
  }
  const amount = parseDiscountNumber(values.amount);
  if (!amount || amount <= 0) {
    errors.amount = 'Enter a valid amount';
  }
  if (values.discountType === 'PERCENTAGE' && amount >= 100) {
    errors.amount = 'Percentage must be less than 100';
  }
  const usageLimit = parseDiscountNumber(values.usageLimit);
  if (!usageLimit || usageLimit <= 0) {
    errors.usageLimit = 'Usage limit is required';
  }

  if (slug === 'amountOffCategory' && !values.categoryId) {
    errors.categoryId = 'Select a category';
  }
  if (slug === 'amountOffProduct' && values.productIds.length === 0) {
    errors.productIds = 'Select at least one product';
  }

  return errors;
}

export function buildDiscountPayload(
  values: DiscountFormValues,
  slug: DiscountRouteSlug,
  productIdsInCategory?: string[],
) {
  const category = DISCOUNT_ROUTE_SLUGS[slug];
  const startDate = mergeDateTime(values.startDate, values.startTime);
  const endDate = values.hasExpiry ? mergeDateTime(values.endDate, values.endTime) : null;

  const base: Record<string, unknown> = {
    code: values.code || undefined,
    target: values.target,
    startDate,
    endDate,
    usageLimit: parseDiscountNumber(values.usageLimit),
    category,
  };

  if (slug === 'freeDelivery') {
    return {
      ...base,
      type: 'FREE_DELIVERY',
      discount: 100,
      minimumOrderAmount: parseDiscountNumber(values.minOrderAmount),
    };
  }

  const type = values.discountType;
  const discount = parseDiscountNumber(values.amount);
  const minimumOrderAmount = parseDiscountNumber(values.minOrderAmount);

  if (slug === 'amountOffOrder') {
    return {
      ...base,
      type,
      discount,
      minimumOrderAmount,
    };
  }

  if (slug === 'amountOffProduct') {
    return {
      ...base,
      type,
      discount,
      applicableItems: values.productIds,
    };
  }

  if (slug === 'amountOffCategory') {
    return {
      ...base,
      type,
      discount,
      category: 'amount_off_category',
      categoryId: values.categoryId,
      applicableItems: productIdsInCategory ?? [],
    };
  }

  return {
    ...base,
    type,
    discount,
  };
}
