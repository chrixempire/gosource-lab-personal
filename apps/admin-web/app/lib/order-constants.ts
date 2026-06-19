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

export type OrderStatusTagVariant = (typeof ORDER_STATUS_OPTIONS)[number]['tagVariant'];
export type OrderPaymentStatusTagVariant =
  (typeof ORDER_PAYMENT_STATUS_OPTIONS)[number]['tagVariant'];

/** Statuses that cannot be set via update-order-status (derived or terminal). */
export const ORDER_STATUSES_NOT_MANUALLY_SETTABLE = [
  'cancelled',
  'pending',
  'partially_delivered',
] as const;

export const ORDER_STATUS_CHANGE_OPTIONS = ORDER_STATUS_OPTIONS.filter(
  (option) =>
    !ORDER_STATUSES_NOT_MANUALLY_SETTABLE.includes(
      option.value as (typeof ORDER_STATUSES_NOT_MANUALLY_SETTABLE)[number],
    ),
);

/** Terminal order statuses — no manual status dropdown (reference StatusUpdaterBadge). */
export const ORDER_STATUSES_NOT_UPDATABLE = ['cancelled', 'delivered'] as const;

export function isOrderStatusManuallyUpdatable(status: string | undefined | null) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    return false;
  }

  return !ORDER_STATUSES_NOT_UPDATABLE.includes(
    normalized as (typeof ORDER_STATUSES_NOT_UPDATABLE)[number],
  );
}

export function isOrderPaymentStatusManuallyUpdatable(status: string | undefined | null) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase();

  return normalized === 'pending' || normalized === 'partial';
}

export function getOrderStatusTagVariant(status: string | undefined | null): OrderStatusTagVariant {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  const match = ORDER_STATUS_OPTIONS.find((option) => option.value === normalized);
  if (match) {
    return match.tagVariant;
  }

  if (['delivered', 'completed'].includes(normalized)) {
    return 'success';
  }

  if (['cancelled', 'returned', 'refunded'].includes(normalized)) {
    return 'negative';
  }

  return 'warning';
}

export function getOrderPaymentStatusTagVariant(
  status: string | undefined | null,
): OrderPaymentStatusTagVariant {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  const match = ORDER_PAYMENT_STATUS_OPTIONS.find((option) => option.value === normalized);
  if (match) {
    return match.tagVariant;
  }

  return 'warning';
}

export function getOrderStatusLabel(status: string | undefined | null) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  const match = ORDER_STATUS_OPTIONS.find((option) => option.value === normalized);
  if (match) {
    return match.label;
  }

  if (!normalized) {
    return 'Pending';
  }

  return normalized
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getOrderPaymentStatusLabel(status: string | undefined | null) {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  const match = ORDER_PAYMENT_STATUS_OPTIONS.find((option) => option.value === normalized);
  if (match) {
    return match.label;
  }

  if (!normalized) {
    return 'Pending';
  }

  return normalized
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

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
