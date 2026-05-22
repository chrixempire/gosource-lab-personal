import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import { mapLegacyOrderToListItem } from '~/lib/order-details';
import type {
  AdminOrderListItem,
  LegacyOrderRow,
  OrderCustomerOption,
  OrderTableMeta,
} from '~/types/orders';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function parseOrderTableMeta(
  body: Record<string, unknown> | null,
  fallback: { page: number; limit: number },
): OrderTableMeta {
  const meta = asRecord(body?.meta);

  if (meta) {
    const total = Number(meta.totalDocuments) || Number(meta.total) || 0;
    const limit = Number(meta.limit) || fallback.limit;
    const page = Number(meta.page) || fallback.page;
    const totalPages = Math.max(1, Number(meta.totalPages) || Math.ceil(total / limit) || 1);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: meta.hasNext === true || page < totalPages,
      hasPrev: meta.hasPrev === true || page > 1,
    };
  }

  return {
    page: fallback.page,
    limit: fallback.limit,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };
}

export function parseFilteredOrdersResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): { rows: AdminOrderListItem[]; meta: OrderTableMeta } {
  const body = unwrapLegacyPayload(payload) ?? asRecord(payload);
  const orders = Array.isArray(body?.orders) ? (body.orders as LegacyOrderRow[]) : [];

  return {
    rows: orders.map(mapLegacyOrderToListItem),
    meta: parseOrderTableMeta(body, { page: fallbackPage, limit: fallbackLimit }),
  };
}

export function parseOrderCustomersResponse(payload: unknown): OrderCustomerOption[] {
  const root = asRecord(payload);
  const direct = root?.data;
  const rows = Array.isArray(direct)
    ? (direct as Record<string, unknown>[])
    : Array.isArray(payload)
      ? (payload as Record<string, unknown>[])
      : [];

  return rows
    .map((row) => {
      const id = typeof row._id === 'string' ? row._id : '';
      const label =
        typeof row.businessName === 'string'
          ? row.businessName
          : typeof row.name === 'string'
            ? row.name
            : '';

      if (!id || !label) {
        return null;
      }

      return { id, label };
    })
    .filter((row): row is OrderCustomerOption => row !== null);
}

export function serialNumber(index: number, page: number, pageSize: number) {
  return (page - 1) * pageSize + index + 1;
}
