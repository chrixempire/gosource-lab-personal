export type PurchaseOrderInvoicePreview = {
  referenceLabel: string;
  expectedDateLabel: string;
  orderedByLabel: string;
  billTo: { name: string; email: string }[];
  note: string;
  logisticsAmount: number;
  lineItems: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  total: number;
};

type LegacyPurchaseOrderRow = {
  _id?: string;
  id?: string;
  expectedDate?: string;
  note?: string;
  logisticsAmount?: number;
  products?: Array<{
    product?: { name?: string };
    quantity?: number;
    totalPrice?: number;
  }>;
  suppliers?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
  }>;
  creator?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function unwrapLegacyPayload(payload: unknown): Record<string, unknown> | null {
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

function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
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

export function parsePurchaseOrderDetail(payload: unknown): LegacyPurchaseOrderRow | null {
  const body = unwrapLegacyPayload(payload);
  if (!body) {
    return null;
  }

  if (body._id || body.id) {
    return body as LegacyPurchaseOrderRow;
  }

  const nested = body.purchaseOrder;
  if (nested && typeof nested === 'object') {
    return nested as LegacyPurchaseOrderRow;
  }

  return null;
}

export function buildPurchaseOrderInvoicePreview(
  order: LegacyPurchaseOrderRow,
): PurchaseOrderInvoicePreview {
  const id = String(order._id ?? order.id ?? '');
  const lineItems = (order.products ?? []).map((item) => {
    const quantity = item.quantity ?? 0;
    const totalPrice = item.totalPrice ?? 0;
    const unitPrice = quantity > 0 ? totalPrice / quantity : 0;

    return {
      name: item.product?.name ?? 'Product',
      quantity,
      unitPrice,
      totalPrice,
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const logisticsAmount = Number(order.logisticsAmount ?? 0);

  const billTo = (order.suppliers ?? []).map((supplier) => {
    const name = `${supplier.firstName ?? ''} ${supplier.lastName ?? ''}`.trim();
    const email = String(supplier.email ?? '').trim();
    return {
      name: name || email || '—',
      email: email || '—',
    };
  });

  const creator = order.creator;
  const orderedByLabel = creator
    ? `${creator.firstName ?? ''} ${creator.lastName ?? ''}`.trim() ||
      String(creator.email ?? '').trim() ||
      '—'
    : '—';

  return {
    referenceLabel: id ? `#${id.slice(-5).toUpperCase()}` : '#DRAFT',
    expectedDateLabel: formatDateTimeLabel(order.expectedDate),
    orderedByLabel,
    billTo,
    note: String(order.note ?? ''),
    logisticsAmount,
    lineItems,
    subtotal,
    total: subtotal + logisticsAmount,
  };
}
