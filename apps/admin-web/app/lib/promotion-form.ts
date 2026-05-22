import { DEFAULT_PROMOTION_ICON_COLOR } from '~/lib/promotion-icon-colors';
import type { LegacyPromotionRow, PromotionFormProduct, PromotionFormValues } from '~/types/promotions';

export function createEmptyPromotionFormValues(): PromotionFormValues {
  return {
    name: '',
    description: '',
    icon: '',
    color: DEFAULT_PROMOTION_ICON_COLOR,
    startDate: '',
    endDate: '',
    isPercentageDiscounted: false,
    discountPercentage: '',
    productIds: [],
    products: [],
  };
}

function toDateInput(iso?: string | null) {
  if (!iso) {
    return '';
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString().slice(0, 10);
}

function mapProductEntry(entry: NonNullable<LegacyPromotionRow['products']>[number]): PromotionFormProduct | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const id = String(entry._id ?? entry.id ?? '');
  if (!id) {
    return null;
  }
  return {
    id,
    name: entry.name ?? 'Product',
    imageUrl: entry.images?.[0]?.url ?? null,
    hasPromotion: Boolean(entry.promotion),
  };
}

export function mapPromotionToFormValues(row: LegacyPromotionRow): PromotionFormValues {
  const products = (row.products ?? [])
    .map((entry) => mapProductEntry(entry))
    .filter((entry): entry is PromotionFormProduct => Boolean(entry));

  return {
    name: row.name ?? '',
    description: row.description ?? '',
    icon: row.icon ?? '',
    color: DEFAULT_PROMOTION_ICON_COLOR,
    startDate: toDateInput(row.startDate),
    endDate: toDateInput(row.endDate),
    isPercentageDiscounted: row.isPercentageDiscounted === true,
    discountPercentage:
      row.discountValue != null && row.isPercentageDiscounted ? String(row.discountValue) : '',
    productIds: products.map((product) => product.id),
    products,
  };
}

export function validatePromotionForm(values: PromotionFormValues) {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required';
  }
  if (!values.description.trim()) {
    errors.description = 'Description is required';
  }
  if (!values.icon) {
    errors.icon = 'Select an icon';
  }
  if (!values.startDate) {
    errors.startDate = 'Start date is required';
  }
  if (!values.endDate) {
    errors.endDate = 'End date is required';
  }
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = 'End date must be after start date';
  }
  if (values.isPercentageDiscounted) {
    const pct = Number(values.discountPercentage);
    if (!values.discountPercentage || Number.isNaN(pct)) {
      errors.discountPercentage = 'Discount percentage is required';
    } else if (pct < 1 || pct > 100) {
      errors.discountPercentage = 'Enter a value between 1 and 100';
    }
  }
  if (values.productIds.length === 0) {
    errors.products = 'Add at least one item';
  }

  return errors;
}

export function buildPromotionPayload(values: PromotionFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    icon: values.icon,
    startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString(),
    endDate: new Date(`${values.endDate}T23:59:59.999Z`).toISOString(),
    products: values.productIds,
    isPercentageDiscounted: values.isPercentageDiscounted,
    discountValue: values.isPercentageDiscounted
      ? Number(values.discountPercentage)
      : undefined,
  };
}
