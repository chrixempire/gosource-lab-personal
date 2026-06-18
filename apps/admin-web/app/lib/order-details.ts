import { formatDashboardCurrency } from '~/lib/dashboard-date';
import {
  applySubtotalFallbackToOrderLines,
  resolveOrderLinePricing,
  resolveOrderSubtotal,
  resolveOrderTotalPrice,
} from '~/lib/order-line-pricing';
import {
  displayOrDash,
  formatOrderActorName,
  mapLegacyOrderActor,
  resolveCustomerPosition,
  resolveOrderBranchLabel,
  resolveOrderBusiness,
  resolveOrderInitiator,
} from '~/lib/order-detail-compat';
import { getOrderPaymentMethodLabel } from '~/lib/order-constants';
import type {
  AdminOrderListItem,
  LegacyOrderBusiness,
  LegacyOrderRow,
  OrderPaymentStatus,
  OrderStatus,
} from '~/types/orders';

type OrderStatusTagVariant = AdminOrderListItem['statusVariant'];
type PaymentStatusTagVariant = AdminOrderListItem['paymentStatusVariant'];

function formatStatusLabel(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeOrderStatus(status: string | undefined | null): OrderStatus {
  if (!status) {
    return 'pending';
  }

  return status.trim().toLowerCase().replace(/\s+/g, '_') as OrderStatus;
}

export function normalizeOrderPaymentStatus(
  status: string | undefined | null,
): OrderPaymentStatus {
  if (!status) {
    return 'pending';
  }

  return status.trim().toLowerCase().replace(/\s+/g, '_') as OrderPaymentStatus;
}

export function formatOrderDateTime(value: string | undefined) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getOrderStatusVariant(status: OrderStatus): OrderStatusTagVariant {
  if (status === 'ready') {
    return 'ready';
  }

  if (status === 'partially_delivered') {
    return 'partiallyDelivered';
  }

  if (status === 'accepted') {
    return 'accepted';
  }

  if (['delivered', 'completed'].includes(status)) {
    return 'success';
  }

  if (['cancelled', 'returned', 'refunded'].includes(status)) {
    return 'negative';
  }

  return 'warning';
}

export function getOrderPaymentStatusVariant(
  status: OrderPaymentStatus,
): PaymentStatusTagVariant {
  if (status === 'paid') {
    return 'success';
  }

  if (status === 'cancelled' || status === 'refunded') {
    return 'negative';
  }

  return 'warning';
}

function resolveBusiness(order: LegacyOrderRow): LegacyOrderBusiness | null {
  if (!order.business) {
    return null;
  }

  if (typeof order.business === 'string') {
    return { _id: order.business };
  }

  return order.business;
}

export function mapLegacyOrderToListItem(order: LegacyOrderRow): AdminOrderListItem {
  const business = resolveBusiness(order);
  const itemCount = Array.isArray(order.products) ? order.products.length : 0;
  const status = normalizeOrderStatus(order.status);
  const paymentStatus = normalizeOrderPaymentStatus(order.paymentStatus);
  const reference = order.reference ?? '';
  const lineItems = mapLegacyOrderLineItems(order as Record<string, unknown>);
  const totalPrice = resolveOrderTotalPrice(order as Record<string, unknown>, lineItems);

  return {
    id: order._id,
    reference,
    referenceLabel: reference ? `#${reference}` : '—',
    createdAt: order.createdAt ?? '',
    createdLabel: formatOrderDateTime(order.createdAt),
    itemCount,
    itemCountLabel: `${itemCount} item${itemCount === 1 ? '' : 's'}`,
    totalPrice,
    totalLabel: formatDashboardCurrency(totalPrice),
    paymentMethod: String(order.paymentMethod ?? ''),
    paymentMethodLabel: getOrderPaymentMethodLabel(order.paymentMethod),
    paymentStatus,
    paymentStatusLabel: formatStatusLabel(paymentStatus),
    paymentStatusVariant: getOrderPaymentStatusVariant(paymentStatus),
    status,
    statusLabel: formatStatusLabel(status),
    statusVariant: getOrderStatusVariant(status),
    customerId: business?._id ?? '',
    customerName: business?.businessName ?? '—',
  };
}

export type AdminOrderLineItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lineTotal: number;
  lineTotalLabel: string;
  status: string;
  isDelivered: boolean;
  statusLabel: string;
  statusVariant: 'success' | 'warning';
};

export function getLineItemStatusDisplay(item: Pick<AdminOrderLineItem, 'status' | 'isDelivered'>) {
  if (item.isDelivered || item.status.trim().toLowerCase() === 'delivered') {
    return { label: 'Delivered', variant: 'success' as const };
  }

  return { label: 'Pending', variant: 'warning' as const };
}

export type AdminOrderTimelineEvent = {
  id: string;
  title: string;
  description: string;
  updatedLabel: string;
};

export type AdminOrderDetailsView = {
  id: string;
  reference: string;
  referenceLabel: string;
  status: OrderStatus;
  statusLabel: string;
  statusVariant: OrderStatusTagVariant;
  paymentStatus: OrderPaymentStatus;
  paymentStatusLabel: string;
  paymentStatusVariant: PaymentStatusTagVariant;
  paymentMethod: string | null;
  paymentMethodLabel: string;
  createdLabel: string;
  phoneNumber: string;
  approvedByName: string;
  customerFullName: string;
  customerEmail: string;
  customerBranch: string;
  customerPosition: string;
  customerPhone: string;
  addressLine: string;
  addressDirections: string | null;
  lineItems: AdminOrderLineItem[];
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  totalPrice: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function getLineItemName(line: Record<string, unknown>) {
  const product = asRecord(line.product);
  const cartProduct = asRecord(line.cartProduct);
  return (
    (typeof line.productName === 'string' && line.productName) ||
    (typeof product?.name === 'string' && product.name) ||
    (typeof cartProduct?.name === 'string' && cartProduct.name) ||
    'Product'
  );
}

function resolveOrderBusinessId(order: Record<string, unknown>) {
  const business = resolveOrderBusiness(order);
  return toStringValue(business?._id ?? order.business ?? order.businessId ?? order.customerId);
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim();
}

export function mapLegacyOrderLineItems(order: Record<string, unknown>): AdminOrderLineItem[] {
  const products = Array.isArray(order.products) ? order.products : [];
  const businessId = resolveOrderBusinessId(order);

  const rawLines = products.map((entry, index) => {
    const line = asRecord(entry) ?? {};
    const { lineTotal, unit } = resolveOrderLinePricing(line, businessId);

    return {
      id: String(line._id ?? `line-${index}`),
      name: getLineItemName(line),
      quantity: Number(line.quantity ?? 0),
      unit,
      lineTotal,
      status: String(line.status ?? ''),
      isDelivered: String(line.status ?? '').toLowerCase() === 'delivered',
    };
  });

  const fallbackSubtotal = resolveOrderSubtotal(order, rawLines);
  const pricedLines = applySubtotalFallbackToOrderLines(rawLines, fallbackSubtotal);

  return pricedLines.map((line) => {
    const statusDisplay = getLineItemStatusDisplay(line);

    return {
      ...line,
      lineTotalLabel: formatDashboardCurrency(line.lineTotal),
      statusLabel: statusDisplay.label,
      statusVariant: statusDisplay.variant,
    };
  });
}

export function mapLegacyOrderTimeline(order: Record<string, unknown>): AdminOrderTimelineEvent[] {
  const timeline = Array.isArray(order.timeline) ? order.timeline : [];

  return [...timeline]
    .map((entry, index) => {
      const event = asRecord(entry) ?? {};
      const updatedAt = String(event.updatedAt ?? event.createdAt ?? '');

      return {
        id: String(event._id ?? `timeline-${index}`),
        title: formatStatusLabel(String(event.title ?? 'Update')),
        description: String(event.description ?? ''),
        updatedAt,
      };
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt) || 0;
      const bTime = Date.parse(b.updatedAt) || 0;
      return aTime - bTime;
    })
    .map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      updatedLabel: formatOrderDateTime(event.updatedAt),
    }));
}

export function mapLegacyOrderToDetailsView(order: Record<string, unknown>): AdminOrderDetailsView {
  const listItem = mapLegacyOrderToListItem(order as LegacyOrderRow);
  const initiator = resolveOrderInitiator(order);
  const business = resolveOrderBusiness(order);
  const address = asRecord(order.address);
  const request = asRecord(order.request);
  const approver = mapLegacyOrderActor(request?.approver);

  const customerFullName =
    formatOrderActorName(initiator) ?? displayOrDash(business?.businessName) ?? listItem.customerName;

  const addressLine = address
    ? [address.streetAddress, address.lga, address.state].filter(Boolean).join(', ')
    : '—';

  const approvedByName = formatOrderActorName(approver) ?? customerFullName;

  const lineItems = mapLegacyOrderLineItems(order);

  return {
    id: listItem.id,
    reference: listItem.reference,
    referenceLabel: listItem.referenceLabel,
    status: listItem.status,
    statusLabel: listItem.statusLabel,
    statusVariant: listItem.statusVariant,
    paymentStatus: listItem.paymentStatus,
    paymentStatusLabel: listItem.paymentStatusLabel,
    paymentStatusVariant: listItem.paymentStatusVariant,
    paymentMethod: listItem.paymentMethod || null,
    paymentMethodLabel: listItem.paymentMethodLabel,
    createdLabel: listItem.createdLabel,
    phoneNumber: displayOrDash(order.phoneNumber ?? initiator?.phoneNumber),
    approvedByName,
    customerFullName,
    customerEmail: displayOrDash(initiator?.email ?? business?.email),
    customerBranch: resolveOrderBranchLabel(order),
    customerPosition: resolveCustomerPosition(initiator),
    customerPhone: displayOrDash(initiator?.phoneNumber ?? order.phoneNumber),
    addressLine,
    addressDirections:
      typeof address?.directions === 'string' && address.directions
        ? address.directions
        : null,
    lineItems,
    subtotal: resolveOrderSubtotal(order, lineItems),
    deliveryFee: Number(order.deliveryFee ?? 0),
    serviceCharge: Number(order.serviceCharge ?? 0),
    discount: Number(order.discount ?? 0),
    totalPrice: resolveOrderTotalPrice(order, lineItems),
  };
}
