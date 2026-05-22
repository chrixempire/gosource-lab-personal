import type { LegacyPurchaseOrderRow, PurchaseOrderFormValues } from '~/types/purchase-orders';

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
    logisticsAmount: String(order.logisticsAmount ?? 0),
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
        categoryLabel:
          item.product?.category?.name ?? item.product?.categoryInfo?.name ?? '—',
        imageUrl: item.product?.image ?? null,
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
