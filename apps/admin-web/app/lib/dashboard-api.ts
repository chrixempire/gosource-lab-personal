import { fillTrendPoints } from '~/lib/dashboard-trends';
import type {
  DashboardBestSeller,
  DashboardDateFilterValue,
  DashboardRankedCustomer,
  DashboardStatusSlice,
  DashboardTableMeta,
  DashboardTrendPoint,
} from '~/types/dashboard';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/** Legacy admin routes sometimes return `{ data }`, sometimes a flat payload. */
export function unwrapLegacyPayload(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }

  const data = root.data;
  // Only unwrap object payloads (e.g. `{ data: { customer, orders } }`). Arrays like
  // `{ data: [...], meta }` must keep the root so list parsers see `data` and `meta`.
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return root;
}

function parseTableMeta(
  body: Record<string, unknown> | null,
  fallback: { page: number; limit: number; rowCount: number },
): DashboardTableMeta {
  const meta = asRecord(body?.meta);
  if (meta) {
    const total = Number(meta.total) || 0;
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

  const total = fallback.rowCount;
  const totalPages = Math.max(1, Math.ceil(total / fallback.limit) || 1);

  return {
    page: fallback.page,
    limit: fallback.limit,
    total,
    totalPages,
    hasNext: fallback.page < totalPages,
    hasPrev: fallback.page > 1,
  };
}

export function parseBestSellingResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): { rows: DashboardBestSeller[]; meta: DashboardTableMeta } {
  const body = unwrapLegacyPayload(payload) ?? asRecord(payload);
  const rows = Array.isArray(body?.topBestSellers)
    ? (body.topBestSellers as DashboardBestSeller[])
    : [];

  return {
    rows,
    meta: parseTableMeta(body, {
      page: fallbackPage,
      limit: fallbackLimit,
      rowCount: rows.length,
    }),
  };
}

export function parseCustomerRankingResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): { rows: DashboardRankedCustomer[]; meta: DashboardTableMeta } {
  const body = unwrapLegacyPayload(payload) ?? asRecord(payload);
  const rows = Array.isArray(body?.customers)
    ? (body.customers as DashboardRankedCustomer[])
    : [];

  return {
    rows,
    meta: parseTableMeta(body, {
      page: fallbackPage,
      limit: fallbackLimit,
      rowCount: rows.length,
    }),
  };
}

export function serialNumber(index: number, page: number, pageSize: number) {
  return (page - 1) * pageSize + index + 1;
}

export function parseOrderMetrics(
  payload: unknown,
  filter: DashboardDateFilterValue,
): {
  trendPoints: DashboardTrendPoint[];
  statusSlices: DashboardStatusSlice[];
} {
  const body = unwrapLegacyPayload(payload) ?? asRecord(payload);
  const trends = asRecord(body?.trends);
  const statusBreakdown = asRecord(body?.statusBreakdown);

  const rawTrendPoints = Array.isArray(trends?.points)
    ? (trends.points as DashboardTrendPoint[])
    : [];

  const trendPoints = fillTrendPoints(filter, rawTrendPoints);

  const statusSlices = Array.isArray(statusBreakdown?.slices)
    ? (statusBreakdown.slices as DashboardStatusSlice[])
    : [];

  return { trendPoints, statusSlices };
}

type ProductLike = {
  name?: string;
  actualPrice?: number;
  discountPrice?: number;
  _id?: string;
};

export function getBestSellerRowId(row: DashboardBestSeller, index: number): string {
  const productId = row.product?._id;
  if (typeof productId === 'string' && productId) {
    return productId;
  }

  const rawId = row._id as unknown;
  if (typeof rawId === 'string' && rawId) {
    return rawId;
  }

  if (rawId && typeof rawId === 'object') {
    const embedded = rawId as ProductLike;
    if (embedded._id) {
      return String(embedded._id);
    }
    if (embedded.name) {
      return `${embedded.name}-${index}`;
    }
  }

  return `product-row-${index}`;
}

export function getBestSellerProductName(row: DashboardBestSeller): string {
  if (row.product?.name) {
    return row.product.name;
  }

  const rawId = row._id as unknown;
  if (rawId && typeof rawId === 'object' && (rawId as ProductLike).name) {
    return (rawId as ProductLike).name!;
  }

  return '—';
}

export function getBestSellerProductPrice(row: DashboardBestSeller): number {
  const fromProduct = row.product;
  if (fromProduct?.discountPrice != null) {
    return fromProduct.discountPrice;
  }
  if (fromProduct?.actualPrice != null) {
    return fromProduct.actualPrice;
  }

  const rawId = row._id as unknown;
  if (rawId && typeof rawId === 'object') {
    const embedded = rawId as ProductLike;
    if (embedded.discountPrice != null) {
      return embedded.discountPrice;
    }
    if (embedded.actualPrice != null) {
      return embedded.actualPrice;
    }
  }

  return 0;
}
