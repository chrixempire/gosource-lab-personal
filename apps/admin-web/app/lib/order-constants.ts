import type { OrderPaymentStatus, OrderStatus } from '~/types/orders';

type TagVariant =
  | 'default'
  | 'info'
  | 'success'
  | 'negative'
  | 'warning'
  | 'ready'
  | 'partiallyDelivered'
  | 'accepted';

export const ORDER_PAYMENT_METHOD_OPTIONS = [
  { value: 'Credit', label: 'Credit' },
  { value: 'Transfer', label: 'Bank transfer' },
  { value: 'Wallet', label: 'Wallet' },
  { value: 'Paystack', label: 'Online' },
] as const;

export const ORDER_PAYMENT_STATUS_OPTIONS: Array<{
  value: OrderPaymentStatus;
  label: string;
  tagVariant: TagVariant;
}> = [
  { value: 'pending', label: 'Pending', tagVariant: 'warning' },
  { value: 'partial', label: 'Partial', tagVariant: 'default' },
  { value: 'paid', label: 'Paid', tagVariant: 'success' },
  { value: 'cancelled', label: 'Cancelled', tagVariant: 'negative' },
  { value: 'refunded', label: 'Refunded', tagVariant: 'default' },
];

export const ORDER_STATUS_OPTIONS: Array<{
  value: OrderStatus;
  label: string;
  tagVariant: TagVariant;
}> = [
  { value: 'pending', label: 'Pending', tagVariant: 'warning' },
  { value: 'accepted', label: 'Accepted', tagVariant: 'accepted' },
  { value: 'processing', label: 'Processing', tagVariant: 'info' },
  { value: 'ready', label: 'Ready', tagVariant: 'ready' },
  { value: 'shipped', label: 'Shipped', tagVariant: 'default' },
  { value: 'partially_delivered', label: 'Partially delivered', tagVariant: 'partiallyDelivered' },
  { value: 'delivered', label: 'Delivered', tagVariant: 'success' },
  { value: 'cancelled', label: 'Cancelled', tagVariant: 'negative' },
];

export const ORDER_QUICK_STATUS_FILTERS = [
  { key: 'pending', label: 'Pending orders' },
  { key: 'processing', label: 'Processing orders' },
  { key: 'shipped', label: 'Shipped orders' },
  { key: 'delivered', label: 'Delivered orders' },
  { key: 'cancelled', label: 'Cancelled orders' },
] as const;

export function isOrderCancellable(order: {
  status?: string;
  paymentStatus?: string;
}) {
  const normalizedStatus = String(order.status ?? '').trim().toLowerCase();
  const isCompleted = ['cancelled', 'delivered', 'completed', 'returned', 'refunded'].includes(
    normalizedStatus,
  );

  return !isCompleted;
}

export function getOrderPaymentMethodLabel(method: string | undefined) {
  if (!method) {
    return '—';
  }

  const match = ORDER_PAYMENT_METHOD_OPTIONS.find(
    (option) => option.value.toLowerCase() === method.toLowerCase(),
  );

  return match?.label ?? method;
}
