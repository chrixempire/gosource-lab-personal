import { mapLegacyOrderLineItems } from '../../app/lib/order-details';
import { resolveOrderSubtotal, resolveOrderTotalPrice } from '../../app/lib/order-line-pricing';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function unwrapLegacyOrderDetail(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }

  const data = root.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return root;
}

export type OrderInvoicePreview = {
  referenceLabel: string;
  orderDateLabel: string;
  businessName: string;
  customerName: string;
  paymentMethod: string;
  deliveryAddress: string;
  lineItems: {
    name: string;
    quantityLabel: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  total: number;
};

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function formatDateTimeLabel(value: unknown) {
  if (!value) {
    return '—';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function buildOrderInvoicePreview(order: Record<string, unknown>): OrderInvoicePreview {
  const reference = String(order.reference ?? order._id ?? '');
  const business = asRecord(order.business);
  const request = asRecord(order.request);
  const initiator = asRecord(request?.initiator);
  const address = asRecord(order.address);
  const branch = asRecord(order.branch);

  const customerName =
    [initiator?.firstName, initiator?.lastName].filter(Boolean).join(' ').trim() ||
    String(business?.businessName ?? '—');

  const street = String(branch?.streetName ?? address?.streetAddress ?? '');
  const lga = String(branch?.lga ?? address?.lga ?? '');
  const state = String(address?.state ?? '');
  const deliveryAddress = [street, lga, state].filter(Boolean).join(', ') || '—';

  const mappedLines = mapLegacyOrderLineItems(order);
  const lineItems = mappedLines.map((item) => ({
    name: item.name,
    quantityLabel: `${item.quantity} ${item.unit}`.trim(),
    unitPrice: item.quantity > 0 ? item.lineTotal / item.quantity : item.lineTotal,
    totalPrice: item.lineTotal,
  }));

  const deliveryFee = Number(order.deliveryFee ?? 0);
  const serviceCharge = Number(order.serviceCharge ?? 0);
  const subtotal = resolveOrderSubtotal(order, mappedLines);
  const total = resolveOrderTotalPrice(order, mappedLines);

  return {
    referenceLabel: reference ? `#${reference}` : '—',
    orderDateLabel: formatDateTimeLabel(order.createdAt),
    businessName: String(business?.businessName ?? '—'),
    customerName,
    paymentMethod: String(order.paymentMethod ?? '—'),
    deliveryAddress,
    lineItems,
    subtotal,
    deliveryFee,
    serviceCharge,
    total,
  };
}
