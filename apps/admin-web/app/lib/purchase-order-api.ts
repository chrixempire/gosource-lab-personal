import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { unwrapInventoryData } from '~/lib/inventory-api';
import {
  purchaseOrderProductTypeLabel,
  purchaseOrderStatusLabel,
} from '~/lib/purchase-order-constants';
import { resolvePurchaseOrderLineItemCategoryLabel } from '~/lib/purchase-order-form';
import type {
  AdminPurchaseOrderListItem,
  LegacyPurchaseOrderRow,
  PurchaseOrderInvoicePreview,
  PurchaseOrderListStats,
  PurchaseOrderReceiveRow,
  PurchaseOrderSupplierOption,
} from '~/types/purchase-orders';
import type { InventoryTableMeta } from '~/types/inventory';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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

function isExpectedDateOverdue(expectedDate: string | null | undefined, status: string) {
  if (!expectedDate || status === 'complete') {
    return false;
  }

  const date = new Date(expectedDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export function mapLegacyPurchaseOrderToListItem(
  row: LegacyPurchaseOrderRow,
): AdminPurchaseOrderListItem {
  const products = row.products ?? [];
  const id = String(row._id ?? row.id ?? '');
  const quantityOrdered = products.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const quantityReceived = products.reduce(
    (sum, item) => sum + (item.quantityReceived ?? 0),
    0,
  );
  const itemsTotal = products.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);
  const status = String(row.status ?? 'pending');

  return {
    id,
    referenceLabel: `#${id.slice(-5).toUpperCase()}`,
    createdAt: row.createdAt ?? null,
    createdAtLabel: formatDateLabel(row.createdAt),
    productType: String(row.productType ?? ''),
    productTypeLabel: purchaseOrderProductTypeLabel(String(row.productType ?? '')),
    status,
    statusLabel: purchaseOrderStatusLabel(status),
    itemsCount: products.length,
    itemsTotal,
    itemsTotalLabel: formatDashboardCurrency(itemsTotal),
    quantityOrdered,
    quantityReceived,
    receivePercent:
      quantityOrdered > 0 ? Math.round((quantityReceived / quantityOrdered) * 100) : 0,
    expectedDate: row.expectedDate ?? null,
    expectedDateLabel: formatDateTimeLabel(row.expectedDate),
    expectedDateOverdue: isExpectedDateOverdue(row.expectedDate, status),
    invoicePreview: buildPurchaseOrderInvoicePreview(row),
  };
}

export function parsePurchaseOrdersListResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
) {
  const body = unwrapInventoryData(payload);
  const purchaseOrders = Array.isArray(body?.purchaseOrders)
    ? (body.purchaseOrders as LegacyPurchaseOrderRow[])
    : [];

  const total = Number(body?.totalDocuments) || 0;
  const limit = Number(body?.limit) || fallbackLimit;
  const page = Number(body?.page) || fallbackPage;
  const totalPages = Math.max(1, Number(body?.totalPages) || Math.ceil(total / limit) || 1);

  const meta: InventoryTableMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  const statsRaw = asRecord(body?.stats);
  const stats: PurchaseOrderListStats = {
    totalDocuments: Number(statsRaw?.totalDocuments) || total,
    totalPrice: Number(statsRaw?.totalPrice) || 0,
    totalLogistics: Number(statsRaw?.totalLogistics) || 0,
    pendingCount: Number(statsRaw?.pendingCount) || 0,
    partialCount: Number(statsRaw?.partialCount) || 0,
    completeCount: Number(statsRaw?.completeCount) || 0,
  };

  return {
    rows: purchaseOrders.map(mapLegacyPurchaseOrderToListItem),
    meta,
    stats,
  };
}

export function parsePurchaseOrderDetail(payload: unknown): LegacyPurchaseOrderRow | null {
  const body = unwrapInventoryData(payload);
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

export function parseSupplierOptions(payload: unknown): PurchaseOrderSupplierOption[] {
  const body = unwrapInventoryData(payload);
  const admins = Array.isArray(body?.admins) ? body.admins : [];

  return admins
    .map((admin) => {
      const record = admin as Record<string, unknown>;
      const id = String(record._id ?? record.id ?? '');
      if (!id) {
        return null;
      }

      const firstName = String(record.firstName ?? '');
      const lastName = String(record.lastName ?? '');
      const email = String(record.email ?? '');

      return {
        id,
        label: `${firstName} ${lastName}`.trim() || email || id,
        email,
      };
    })
    .filter((entry): entry is PurchaseOrderSupplierOption => entry != null);
}

function supplierBillToEntry(supplier: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const name = `${supplier.firstName ?? ''} ${supplier.lastName ?? ''}`.trim();
  const email = String(supplier.email ?? '').trim();

  return {
    name: name || email || '—',
    email: email || '—',
  };
}

export function creatorOrderedByLabel(creator?: LegacyPurchaseOrderRow['creator']) {
  if (!creator || typeof creator !== 'object') {
    return '—';
  }

  const name = `${creator.firstName ?? ''} ${creator.lastName ?? ''}`.trim();
  const email = String(creator.email ?? '').trim();
  return name || email || '—';
}

function purchaseOrderReferenceLabel(orderId: string) {
  if (!orderId || orderId === 'preview') {
    return '#DRAFT';
  }
  return `#${orderId.slice(-5).toUpperCase()}`;
}

export function billToFromSupplierOptions(
  supplierIds: string[],
  options: PurchaseOrderSupplierOption[],
  fallbackById: Record<string, { name: string; email: string }> = {},
) {
  const optionById = new Map(options.map((option) => [option.id, option]));

  return supplierIds.map((id) => {
    const option = optionById.get(id);
    if (option) {
      return { name: option.label, email: option.email || '—' };
    }

    const fallback = fallbackById[id];
    if (fallback) {
      return {
        name: fallback.name || '—',
        email: fallback.email || '—',
      };
    }

    return { name: '—', email: '—' };
  });
}

export function billToFromLegacySuppliers(
  suppliers: LegacyPurchaseOrderRow['suppliers'],
) {
  return (suppliers ?? []).map((supplier) => supplierBillToEntry(supplier ?? {}));
}

export function buildPurchaseOrderInvoicePreview(
  order: LegacyPurchaseOrderRow,
  overrides?: {
    billTo?: { name: string; email: string }[];
    orderedByLabel?: string;
    referenceLabel?: string;
  },
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

  const billTo =
    overrides?.billTo ??
    billToFromLegacySuppliers(order.suppliers);

  const orderedByLabel =
    overrides?.orderedByLabel ?? creatorOrderedByLabel(order.creator);

  return {
    referenceLabel: overrides?.referenceLabel ?? purchaseOrderReferenceLabel(id),
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

export function buildReceiveRows(order: LegacyPurchaseOrderRow): PurchaseOrderReceiveRow[] {
  return (order.products ?? []).map((item) => {
    const productId = String(item.product?._id ?? item.product?.id ?? '');
    const ordered = item.quantity ?? 0;
    const received = item.quantityReceived ?? 0;

    return {
      productId,
      name: item.product?.name ?? 'Product',
      categoryLabel: resolvePurchaseOrderLineItemCategoryLabel(item.product),
      ordered,
      received,
      toReceive: '',
      error: '',
    };
  });
}

export async function downloadPurchaseOrderPdf(orderId: string, referenceLabel?: string) {
  const response = await fetch(`/api/purchase-orders/${orderId}/invoice`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Invoice download failed');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `purchase_order_invoice_${referenceLabel ?? orderId}.pdf`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
