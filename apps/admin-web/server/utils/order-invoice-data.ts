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

function lineItemName(line: Record<string, unknown>) {
  const product = asRecord(line.product);
  return (
    (typeof line.productName === 'string' && line.productName) ||
    (typeof product?.name === 'string' && product.name) ||
    'Product'
  );
}

function lineItemTotal(line: Record<string, unknown>) {
  const explicit = Number(line.totalPrice ?? line.lineTotal);
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }

  const quantity = Number(line.quantity ?? 1);
  const unitPrice = Number(line.unitPrice ?? line.price ?? 0);
  return quantity * unitPrice;
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

  const products = Array.isArray(order.products) ? order.products : [];
  const lineItems = products.map((entry) => {
    const line = asRecord(entry) ?? {};
    const quantity = Number(line.quantity ?? 0);
    const unit = String(line.unit ?? 'unit');
    const totalPrice = lineItemTotal(line);
    const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;

    return {
      name: lineItemName(line),
      quantityLabel: `${quantity} ${unit}`.trim(),
      unitPrice,
      totalPrice,
    };
  });

  const deliveryFee = Number(order.deliveryFee ?? 0);
  const serviceCharge = Number(order.serviceCharge ?? 0);
  const discount = Number(order.discount ?? 0);
  const storedTotal = Number(order.totalPrice ?? 0);
  const subtotalFromLines = lineItems.reduce((sum, row) => sum + row.totalPrice, 0);
  const subtotal =
    subtotalFromLines > 0
      ? subtotalFromLines
      : Math.max(0, storedTotal - deliveryFee - serviceCharge + discount);
  const total = storedTotal > subtotal ? storedTotal : subtotal + deliveryFee + serviceCharge - discount;

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
