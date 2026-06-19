import { getCategoryLabel, getProductImageUrl } from '~/lib/product-details';
import { unwrapInventoryData } from '~/lib/inventory-api';
import type { LegacyProductRow } from '~/types/inventory';
import type {
  LegacyPurchaseOrderRow,
  PurchaseOrderFormValues,
  PurchaseOrderLineItem,
} from '~/types/purchase-orders';

export function parsePurchaseOrderAmount(value: string | number | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? '').replace(/[^0-9.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPurchaseOrderAmountField(value: string | number | null | undefined) {
  const amount = parsePurchaseOrderAmount(value);
  if (amount <= 0) {
    return '0';
  }

  return amount.toLocaleString('en-NG');
}

function resolveLineItemCategoryLabel(product?: {
  category?: LegacyProductRow['category'];
  categoryInfo?: { name?: string } | string | null;
}) {
  if (!product) {
    return '—';
  }

  const fromCategory = getCategoryLabel(product.category);
  if (fromCategory !== '—') {
    return fromCategory;
  }

  const { categoryInfo } = product;
  if (categoryInfo && typeof categoryInfo === 'object' && categoryInfo.name) {
    return categoryInfo.name;
  }

  return '—';
}

export function resolvePurchaseOrderLineItemCategoryLabel(product?: {
  category?: LegacyProductRow['category'];
  categoryInfo?: { name?: string } | string | null;
}) {
  return resolveLineItemCategoryLabel(product);
}

function parseLegacyProductRow(payload: unknown): LegacyProductRow | null {
  const body = unwrapInventoryData(payload);
  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (record._id) {
    return record as LegacyProductRow;
  }

  const nested = record.product;
  return nested && typeof nested === 'object' ? (nested as LegacyProductRow) : null;
}

export async function enrichPurchaseOrderLineItemCategories(
  lineItems: PurchaseOrderLineItem[],
) {
  const missingProductIds = [
    ...new Set(
      lineItems
        .filter((item) => item.categoryLabel === '—' && item.productId)
        .map((item) => item.productId),
    ),
  ];

  if (missingProductIds.length === 0) {
    return;
  }

  const categoryByProductId = new Map<string, string>();

  await Promise.all(
    missingProductIds.map(async (productId) => {
      try {
        const payload = await $fetch<unknown>(`/api/products/${productId}`);
        const product = parseLegacyProductRow(payload);
        if (!product) {
          return;
        }

        const label = getCategoryLabel(product.category);
        if (label !== '—') {
          categoryByProductId.set(productId, label);
        }
      } catch {
        // keep existing label when lookup fails
      }
    }),
  );

  for (const item of lineItems) {
    const label = categoryByProductId.get(item.productId);
    if (label) {
      item.categoryLabel = label;
    }
  }
}

function resolveLineItemImageUrl(product?: {
  image?: string;
  images?: Array<{ url?: string }>;
}) {
  if (!product) {
    return null;
  }

  const fromImages = getProductImageUrl(product as LegacyProductRow);
  if (fromImages) {
    return fromImages;
  }

  return typeof product.image === 'string' && product.image ? product.image : null;
}

export function createEmptyPurchaseOrderFormValues(): PurchaseOrderFormValues {
  return {
    productType: '',
    expectedDate: '',
    note: '',
    logisticsAmount: '0',
    suppliers: [],
    lineItems: [],
  };
}

export function mapPurchaseOrderToFormValues(
  order: LegacyPurchaseOrderRow,
): PurchaseOrderFormValues {
  return {
    productType: (order.productType as PurchaseOrderFormValues['productType']) ?? '',
    expectedDate: order.expectedDate
      ? new Date(order.expectedDate).toISOString().slice(0, 10)
      : '',
    note: String(order.note ?? ''),
    logisticsAmount: formatPurchaseOrderAmountField(order.logisticsAmount),
    suppliers: (order.suppliers ?? [])
      .map((supplier) => String(supplier._id ?? supplier.id ?? ''))
      .filter(Boolean),
    lineItems: (order.products ?? []).map((item) => {
      const quantity = item.quantity ?? 0;
      const totalPrice = item.totalPrice ?? 0;
      const productId = String(item.product?._id ?? item.product?.id ?? '');

      return {
        productId,
        name: item.product?.name ?? 'Product',
        categoryLabel: resolveLineItemCategoryLabel(item.product),
        imageUrl: resolveLineItemImageUrl(item.product),
        quantity,
        quantityReceived: item.quantityReceived ?? 0,
        unitPrice: quantity > 0 ? totalPrice / quantity : 0,
        totalPrice,
      };
    }),
  };
}

export function validatePurchaseOrderForm(values: PurchaseOrderFormValues) {
  const errors: Record<string, string> = {};

  if (!values.productType) {
    errors.productType = 'Select a product type';
  }
  if (!values.expectedDate) {
    errors.expectedDate = 'Expected date is required';
  }
  if (values.suppliers.length === 0) {
    errors.suppliers = 'Select at least one supplier';
  }
  if (values.lineItems.length === 0) {
    errors.lineItems = 'Add at least one product';
  }

  return errors;
}

/** Remove validation messages for fields that now pass (e.g. after the user edits). */
export function clearResolvedPurchaseOrderFieldErrors(
  values: PurchaseOrderFormValues,
  fieldErrors: Record<string, string>,
) {
  const latest = validatePurchaseOrderForm(values);

  for (const key of Object.keys(fieldErrors)) {
    if (!(key in latest)) {
      delete fieldErrors[key];
    }
  }
}
