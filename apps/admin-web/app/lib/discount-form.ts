import { DISCOUNT_ROUTE_SLUGS } from '~/lib/discount-constants';
import type { DiscountFormValues, DiscountRouteSlug, LegacyCouponRow } from '~/types/discounts';

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

  return {
    code: coupon.code ?? '',
    discountType:
      coupon.type === 'FREE_DELIVERY' ? 'FREE_DELIVERY' : (coupon.type ?? 'FIXED_AMOUNT'),
    amount: String(coupon.discount ?? ''),
    categoryId: '',
    productIds: [...(coupon.applicableItems ?? [])],
    minOrderAmount: String(coupon.minimumOrderAmount ?? ''),
    usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : '',
    target: coupon.target ?? 'all',
    startDate: start.date,
    startTime: start.time,
    hasExpiry: Boolean(coupon.endDate ?? coupon.expiryDate),
    endDate: end.date,
    endTime: end.time,
  };
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
    if (!values.usageLimit) {
      errors.usageLimit = 'Usage limit is required';
    }
    return errors;
  }

  if (!values.discountType) {
    errors.discountType = 'Select a discount type';
  }
  if (!values.amount || Number(values.amount) <= 0) {
    errors.amount = 'Enter a valid amount';
  }
  if (values.discountType === 'PERCENTAGE' && Number(values.amount) >= 100) {
    errors.amount = 'Percentage must be less than 100';
  }
  if (!values.usageLimit) {
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
    usageLimit: Number(values.usageLimit),
    category,
  };

  if (slug === 'freeDelivery') {
    return {
      ...base,
      type: 'FREE_DELIVERY',
      discount: 100,
      minimumOrderAmount: Number(values.minOrderAmount) || 0,
    };
  }

  const type = values.discountType;
  const discount = Number(values.amount);

  if (slug === 'amountOffOrder') {
    return {
      ...base,
      type,
      discount,
      minimumOrderAmount: Number(values.minOrderAmount) || 0,
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
      category: 'amount_off_items',
      applicableItems: productIdsInCategory ?? [],
    };
  }

  return {
    ...base,
    type,
    discount,
  };
}
