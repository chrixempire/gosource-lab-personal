import type { BranchRecord, ListOrdersQuery, OrderListResponse, OrderRecord } from '@gosource/api-client';
import type { InsightDateFilterValue } from '~/lib/insight-date-filter';
import {
  fillSpendTrendPoints,
  orderSpendTrendBucketKey,
  type SpendTrendPoint,
} from '~/lib/business-insight-trends';

export type { SpendTrendPoint } from '~/lib/business-insight-trends';
/** @deprecated Use SpendTrendPoint */
export type DailySpendPoint = SpendTrendPoint;

const ORDERS_PAGE_LIMIT = 50;
const MAX_ORDER_PAGES = 20;

export type InsightDateRange = {
  startDate: string;
  endDate: string;
};

export type BranchSpendRow = {
  branchId: string;
  branchName: string;
  totalSpend: number;
  orderCount: number;
};

export type PeriodOrderMetrics = {
  totalSpend: number;
  orderCount: number;
  averageOrderValue: number;
  branchSpend: BranchSpendRow[];
  dailySpend: SpendTrendPoint[];
};

export async function fetchOrdersForInsightMetrics(
  listOrders: (query?: ListOrdersQuery) => Promise<OrderListResponse>,
  options: { branchId?: string; range: InsightDateRange },
): Promise<OrderRecord[]> {
  const orders: OrderRecord[] = [];
  let page = 1;

  while (page <= MAX_ORDER_PAGES) {
    const response = await listOrders({
      page,
      limit: ORDERS_PAGE_LIMIT,
      startDate: options.range.startDate,
      endDate: options.range.endDate,
      ...(options.branchId ? { branchId: options.branchId } : {}),
    });

    orders.push(...(response.data ?? []));

    if (!response.meta?.hasNextPage) {
      break;
    }

    page += 1;
  }

  return orders;
}

export function pickMostRecentOrders(orders: OrderRecord[], limit: number): OrderRecord[] {
  return [...orders]
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    })
    .slice(0, limit);
}

function buildRawSpendTrendFromOrders(
  orders: OrderRecord[],
  filter: InsightDateFilterValue,
): SpendTrendPoint[] {
  const bucketMap = new Map<string, SpendTrendPoint>();

  for (const order of orders) {
    const amount = Number(order.totalPrice) || 0;
    const bucketKey = orderSpendTrendBucketKey(order.createdAt, filter.filterType);
    if (!bucketKey) {
      continue;
    }

    const row = bucketMap.get(bucketKey) ?? {
      label: bucketKey,
      date: bucketKey,
      totalSpend: 0,
      orderCount: 0,
    };
    row.totalSpend += amount;
    row.orderCount += 1;
    bucketMap.set(bucketKey, row);
  }

  return [...bucketMap.values()];
}

export function computePeriodMetricsFromOrders(
  orders: OrderRecord[],
  filter: InsightDateFilterValue,
): PeriodOrderMetrics {
  let totalSpend = 0;
  const branchMap = new Map<string, BranchSpendRow>();

  for (const order of orders) {
    const amount = Number(order.totalPrice) || 0;
    totalSpend += amount;

    const branchId = order.branchId?.trim() || 'unknown';
    const branchName = order.branchName?.trim() || 'Unknown branch';
    const branchRow = branchMap.get(branchId) ?? {
      branchId,
      branchName,
      totalSpend: 0,
      orderCount: 0,
    };
    branchRow.totalSpend += amount;
    branchRow.orderCount += 1;
    branchMap.set(branchId, branchRow);
  }

  const branchSpend = [...branchMap.values()].sort((a, b) => b.totalSpend - a.totalSpend);
  const rawTrend = buildRawSpendTrendFromOrders(orders, filter);
  const dailySpend = fillSpendTrendPoints(filter, rawTrend);

  const orderCount = orders.length;

  return {
    totalSpend,
    orderCount,
    averageOrderValue: orderCount > 0 ? totalSpend / orderCount : 0,
    branchSpend,
    dailySpend,
  };
}

/** Every business branch on the axis; spend from orders/API merged in (0 when none). */
export function mergeBranchSpendWithBusinessBranches(
  branches: BranchRecord[],
  spendRows: BranchSpendRow[],
): BranchSpendRow[] {
  if (!branches.length) {
    return spendRows;
  }

  const spendById = new Map<string, BranchSpendRow>();
  const spendByName = new Map<string, BranchSpendRow>();

  for (const row of spendRows) {
    if (row.branchId) {
      spendById.set(row.branchId, row);
    }
    const nameKey = row.branchName.trim().toLowerCase();
    if (nameKey) {
      spendByName.set(nameKey, row);
    }
  }

  const merged = branches.map((branch) => {
    const branchName = branch.branchName?.trim() || 'Branch';
    const byId = spendById.get(branch.id);
    if (byId) {
      return {
        ...byId,
        branchId: branch.id,
        branchName,
      };
    }

    const byName = spendByName.get(branchName.toLowerCase());
    if (byName) {
      return {
        ...byName,
        branchId: branch.id,
        branchName,
      };
    }

    return {
      branchId: branch.id,
      branchName,
      totalSpend: 0,
      orderCount: 0,
    };
  });

  return merged.sort((a, b) => {
    if (b.totalSpend !== a.totalSpend) {
      return b.totalSpend - a.totalSpend;
    }

    return a.branchName.localeCompare(b.branchName);
  });
}

export function parseBranchPerformancePayload(payload: unknown): BranchSpendRow[] {
  const root = payload as { data?: Record<string, { totalOrders?: number; totalValue?: number }> };
  const data = root?.data;
  if (!data || typeof data !== 'object') {
    return [];
  }

  return Object.entries(data)
    .map(([branchName, stats]) => ({
      branchId: branchName,
      branchName,
      orderCount: Number(stats?.totalOrders) || 0,
      totalSpend: Number(stats?.totalValue) || 0,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);
}
