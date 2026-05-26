import type { OrderRecord, OrderStatus } from '@gosource/api-client';
import { formatRequestCurrency, formatRequestDate } from '~/lib/request-details';

type OrderStatusTagVariant =
  | 'success'
  | 'negative'
  | 'warning'
  | 'ready'
  | 'partiallyDelivered'
  | 'accepted';

export type OrderListItem = {
  id: string;
  reference: string;
  branchName: string;
  productTitle: string;
  productSubtitle: string;
  imageUrl: string | null;
  itemsCount: number;
  itemsCountLabel: string;
  totalPrice: number;
  totalLabel: string;
  status: OrderStatus;
  statusLabel: string;
  statusVariant: OrderStatusTagVariant;
  paymentLabel: string;
  createdLabel: string;
  initials: string;
};

export type OrderDetailsView = {
  id: string;
  reference: string;
  branchName: string;
  statusLabel: string;
  statusVariant: OrderStatusTagVariant;
  paymentStatusLabel: string;
  paymentStatusVariant: 'success' | 'negative' | 'warning';
  paymentMethod: string | null;
  approvedByName: string;
  customerFullName: string;
  customerEmail: string;
  customerBranch: string;
  customerPosition: string;
  customerPhone: string;
  phoneNumber: string;
  createdLabel: string;
  addressLine: string;
  addressDirections: string | null;
  products: OrderRecord['products'];
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  totalPrice: number;
};

function formatOrderActorRole(role: string) {
  const normalized = role.trim().toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'super_admin') {
    return 'Super Admin';
  }
  if (normalized === 'employee') {
    return 'Employee';
  }

  return role
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function getOrderStatusVariant(status: OrderStatus) {
  if (status === 'ready') {
    return 'ready' as const;
  }

  if (status === 'partially_delivered') {
    return 'partiallyDelivered' as const;
  }

  if (status === 'accepted') {
    return 'accepted' as const;
  }

  if (['delivered', 'completed'].includes(status)) {
    return 'success' as const;
  }

  if (['cancelled', 'returned', 'refunded'].includes(status)) {
    return 'negative' as const;
  }

  return 'warning' as const;
}

function getOrderPaymentStatusVariant(status: OrderRecord['paymentStatus']) {
  if (status === 'paid') {
    return 'success' as const;
  }

  if (status === 'cancelled') {
    return 'negative' as const;
  }

  return 'warning' as const;
}

export function formatOrderDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatStatusLabel(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function mapOrderToListItem(order: OrderRecord): OrderListItem {
  const products = Array.isArray(order.products) ? order.products : [];
  const firstProduct = products[0];
  const extraCount = Math.max(0, products.length - 1);
  const productTitle = firstProduct?.productName ?? 'Order items';
  const productSubtitle =
    extraCount > 0
      ? `+${extraCount} more item${extraCount === 1 ? '' : 's'}`
      : `${products.length} item${products.length === 1 ? '' : 's'}`;

  return {
    id: order.id,
    reference: order.reference,
    branchName: order.branchName?.trim() || '—',
    productTitle,
    productSubtitle,
    imageUrl: firstProduct?.imageUrl ?? null,
    itemsCount: products.length,
    itemsCountLabel: `${products.length} item${products.length === 1 ? '' : 's'}`,
    totalPrice: order.totalPrice,
    totalLabel: formatRequestCurrency(order.totalPrice),
    status: order.status,
    statusLabel: formatStatusLabel(order.status),
    statusVariant: getOrderStatusVariant(order.status),
    paymentLabel: formatStatusLabel(order.paymentStatus),
    createdLabel: formatRequestDate(order.createdAt),
    initials: productTitle.slice(0, 2).toUpperCase(),
  };
}

export function buildOrderDetailsView(order: OrderRecord): OrderDetailsView {
  const products = Array.isArray(order.products) ? order.products : [];
  const initiator = order.initiator;
  const customerFullName = initiator
    ? [initiator.firstName ?? '', initiator.lastName ?? '']
        .filter(Boolean)
        .join(' ')
        .trim() || initiator.email
    : '—';
  const customerPhone = initiator?.phoneNumber?.trim() || order.phoneNumber || '—';
  const customerPosition = initiator?.role
    ? formatOrderActorRole(initiator.role)
    : '—';

  return {
    id: order.id,
    reference: order.reference,
    branchName: order.branchName,
    statusLabel: formatStatusLabel(order.status),
    statusVariant: getOrderStatusVariant(order.status),
    paymentStatusLabel: formatStatusLabel(order.paymentStatus),
    paymentStatusVariant: getOrderPaymentStatusVariant(order.paymentStatus),
    paymentMethod: order.paymentMethod,
    approvedByName: customerFullName,
    customerFullName,
    customerEmail: initiator?.email ?? '—',
    customerBranch: order.branchName || '—',
    customerPosition,
    customerPhone,
    phoneNumber: order.phoneNumber,
    createdLabel: formatOrderDateTime(order.createdAt),
    addressLine: `${order.address.streetAddress}, ${order.address.lga}, ${order.address.state}`,
    addressDirections: order.address.directions ?? null,
    products,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    serviceCharge: order.serviceCharge,
    discount: order.discount,
    totalPrice: order.totalPrice,
  };
}

export { formatRequestCurrency as formatOrderCurrency };
