import type { PurchaseOrderProductType, PurchaseOrderStatus } from '~/types/purchase-orders';

export const PO_PRODUCT_TYPE_OPTIONS: {
  value: PurchaseOrderProductType;
  label: string;
  snippet: string;
}[] = [
  {
    value: 'non-perishable',
    label: 'Non-perishable items',
    snippet: 'This purchase order is for non-perishable items',
  },
  {
    value: 'perishable',
    label: 'Perishable items',
    snippet: 'This purchase order is for perishable items',
  },
];

export const PO_STATUS_OPTIONS: {
  value: PurchaseOrderStatus;
  label: string;
  variant: 'warning' | 'default' | 'completed';
}[] = [
  { value: 'pending', label: 'Pending', variant: 'warning' },
  { value: 'partial', label: 'Partially received', variant: 'default' },
  { value: 'complete', label: 'Completed', variant: 'completed' },
];

export const PO_QUICK_STATUS_FILTERS: { key: PurchaseOrderStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'partial', label: 'Partially received' },
  { key: 'complete', label: 'Completed' },
];

export function purchaseOrderStatusLabel(status: string) {
  return PO_STATUS_OPTIONS.find((entry) => entry.value === status)?.label ?? status;
}

export function purchaseOrderStatusVariant(status: string) {
  return PO_STATUS_OPTIONS.find((entry) => entry.value === status)?.variant ?? 'default';
}

export function purchaseOrderProductTypeLabel(type: string) {
  return PO_PRODUCT_TYPE_OPTIONS.find((entry) => entry.value === type)?.label ?? type;
}
