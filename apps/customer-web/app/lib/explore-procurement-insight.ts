import type { ListOrdersQuery, OrderListResponse, OrderRecord } from '@gosource/api-client';
import { fetchBranchOrdersInRange } from '~/lib/explore-branch-orders';

export type ProcuredItemRow = {
  name: string;
  totalCost: number;
  quantity: number;
  description: string;
  lastPurchaseDate: string | Date | null;
  /** Branch with the highest spend for this product (all-branches views). */
  branchName?: string;
};

export type SpendingBreakdownRow = {
  label: string;
  percent: number;
  barClass: string;
};

export type ExploreProcurementInsightData = {
  rows: SpendingBreakdownRow[];
  totalSpent: number;
  periodLabel: string;
};

const BAR_CLASSES = [
  'bg-primary-500',
  'bg-negative-500',
  'bg-grey-300',
  'bg-orange-brick',
] as const;
/** Max product lines shown individually; remaining spend rolls into "Others". */
export const PROCUREMENT_INSIGHT_TOP_ITEMS = 3;

export function currentMonthQueryRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function formatProcurementPeriodLabel(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date);
}

function parseOrderTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Best-effort subtitle for order lines (API order products have no description field). */
function descriptionFromOrderLine(line: OrderRecord['products'][number]) {
  const unit = line.unit?.trim();
  return unit || '';
}

function mergeDescription(existing: string, next: string) {
  if (existing.trim()) {
    return existing;
  }

  return next.trim();
}

export function buildProcurementItemsFromOrders(orders: OrderRecord[]): ProcuredItemRow[] {
  const totals = new Map<
    string,
    {
      totalCost: number;
      quantity: number;
      description: string;
      lastPurchaseDate: Date | null;
    }
  >();

  for (const order of orders) {
    const purchaseDate = parseOrderTimestamp(order.createdAt);

    for (const line of order.products ?? []) {
      const name = line.productName?.trim();
      if (!name) {
        continue;
      }

      const amount =
        line.totalPrice > 0
          ? line.totalPrice
          : Math.max(0, line.unitPrice) * Math.max(0, line.quantity);

      if (!Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      const lineQty = Math.max(0, Number(line.quantity ?? 0));
      const existing = totals.get(name) ?? {
        totalCost: 0,
        quantity: 0,
        description: '',
        lastPurchaseDate: null,
      };

      totals.set(name, {
        totalCost: existing.totalCost + amount,
        quantity: existing.quantity + (Number.isFinite(lineQty) ? lineQty : 0),
        description: mergeDescription(existing.description, descriptionFromOrderLine(line)),
        lastPurchaseDate:
          purchaseDate &&
          (!existing.lastPurchaseDate || purchaseDate > existing.lastPurchaseDate)
            ? purchaseDate
            : existing.lastPurchaseDate,
      });
    }
  }

  return [...totals.entries()].map(([name, row]) => ({
    name,
    totalCost: row.totalCost,
    quantity: row.quantity,
    description: row.description,
    lastPurchaseDate: row.lastPurchaseDate,
  }));
}

/** Aggregates products across orders; attributes each line to the top-spend branch. */
export function buildProcurementItemsFromOrdersWithBranch(
  orders: OrderRecord[],
): ProcuredItemRow[] {
  const totals = new Map<
    string,
    {
      totalCost: number;
      quantity: number;
      description: string;
      lastPurchaseDate: Date | null;
      branchSpend: Map<string, number>;
      branchLabels: Map<string, string>;
    }
  >();

  for (const order of orders) {
    const purchaseDate = parseOrderTimestamp(order.createdAt);
    const branchKey = order.branchId?.trim() || order.branchName?.trim() || 'unknown';
    const branchLabel = order.branchName?.trim() || 'Unknown branch';

    for (const line of order.products ?? []) {
      const name = line.productName?.trim();
      if (!name) {
        continue;
      }

      const amount =
        line.totalPrice > 0
          ? line.totalPrice
          : Math.max(0, line.unitPrice) * Math.max(0, line.quantity);

      if (!Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      const lineQty = Math.max(0, Number(line.quantity ?? 0));
      const existing = totals.get(name) ?? {
        totalCost: 0,
        quantity: 0,
        description: '',
        lastPurchaseDate: null,
        branchSpend: new Map<string, number>(),
        branchLabels: new Map<string, string>(),
      };

      existing.branchLabels.set(branchKey, branchLabel);
      existing.branchSpend.set(
        branchKey,
        (existing.branchSpend.get(branchKey) ?? 0) + amount,
      );

      totals.set(name, {
        totalCost: existing.totalCost + amount,
        quantity: existing.quantity + (Number.isFinite(lineQty) ? lineQty : 0),
        description: mergeDescription(existing.description, descriptionFromOrderLine(line)),
        lastPurchaseDate:
          purchaseDate &&
          (!existing.lastPurchaseDate || purchaseDate > existing.lastPurchaseDate)
            ? purchaseDate
            : existing.lastPurchaseDate,
        branchSpend: existing.branchSpend,
        branchLabels: existing.branchLabels,
      });
    }
  }

  return [...totals.entries()].map(([name, row]) => {
    let topBranchKey = '';
    let topBranchSpend = 0;

    for (const [branchKey, spend] of row.branchSpend.entries()) {
      if (spend > topBranchSpend) {
        topBranchSpend = spend;
        topBranchKey = branchKey;
      }
    }

    return {
      name,
      totalCost: row.totalCost,
      quantity: row.quantity,
      description: row.description,
      lastPurchaseDate: row.lastPurchaseDate,
      branchName: row.branchLabels.get(topBranchKey) ?? '—',
    };
  });
}

function parseProcuredItemDate(value: string | Date | null | undefined) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Merges per-branch procurement rows for all-branches views (same sources as single-branch insight). */
export function mergeProcurementItemsAcrossBranches(
  entries: Array<{ branchId: string; branchName: string; items: ProcuredItemRow[] }>,
): ProcuredItemRow[] {
  const totals = new Map<
    string,
    {
      totalCost: number;
      quantity: number;
      description: string;
      lastPurchaseDate: Date | null;
      branchSpend: Map<string, { spend: number; label: string }>;
    }
  >();

  for (const { branchId, branchName, items } of entries) {
    const branchKey = branchId.trim() || branchName.trim() || 'unknown';
    const branchLabel = branchName.trim() || 'Unknown branch';

    for (const item of items) {
      const name = item.name.trim();
      if (!name) {
        continue;
      }

      const existing = totals.get(name) ?? {
        totalCost: 0,
        quantity: 0,
        description: '',
        lastPurchaseDate: null,
        branchSpend: new Map<string, { spend: number; label: string }>(),
      };

      const branchEntry = existing.branchSpend.get(branchKey) ?? { spend: 0, label: branchLabel };
      branchEntry.spend += item.totalCost;
      existing.branchSpend.set(branchKey, branchEntry);

      const itemDate = parseProcuredItemDate(item.lastPurchaseDate);

      totals.set(name, {
        totalCost: existing.totalCost + item.totalCost,
        quantity: existing.quantity + item.quantity,
        description: mergeDescription(existing.description, item.description),
        lastPurchaseDate:
          itemDate && (!existing.lastPurchaseDate || itemDate > existing.lastPurchaseDate)
            ? itemDate
            : existing.lastPurchaseDate,
        branchSpend: existing.branchSpend,
      });
    }
  }

  return [...totals.entries()].map(([name, row]) => {
    let topBranchLabel = '—';
    let topSpend = 0;

    for (const { spend, label } of row.branchSpend.values()) {
      if (spend > topSpend) {
        topSpend = spend;
        topBranchLabel = label;
      }
    }

    return {
      name,
      totalCost: row.totalCost,
      quantity: row.quantity,
      description: row.description,
      lastPurchaseDate: row.lastPurchaseDate,
      branchName: topBranchLabel,
    };
  });
}

export function sumProcuredItemSpend(items: ProcuredItemRow[]) {
  return items.reduce((sum, row) => sum + row.totalCost, 0);
}

type ProductAnalysisApiRow = {
  name?: string;
  totalQuantity?: number;
  totalAmountSpent?: number;
  lastPurchaseDate?: string | Date | null;
  description?: string;
};

export function normalizeProductAnalysisRows(data: unknown): ProductAnalysisApiRow[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.flatMap((entry): ProductAnalysisApiRow[] => {
      const row = entry as ProductAnalysisApiRow;
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      const totalQuantity = Number(row.totalQuantity ?? 0);
      const totalAmountSpent = Number(row.totalAmountSpent ?? 0);

      if (!name || !Number.isFinite(totalAmountSpent) || totalAmountSpent <= 0) {
        return [];
      }

      return [{
        name,
        totalQuantity: Number.isFinite(totalQuantity) ? totalQuantity : 0,
        totalAmountSpent,
        lastPurchaseDate: row.lastPurchaseDate ?? null,
        description:
          typeof row.description === 'string' ? row.description.trim() : '',
      }];
    });
}

export function procuredItemsFromProductAnalysis(
  rows: ProductAnalysisApiRow[],
): ProcuredItemRow[] {
  return rows.map((row) => ({
    name: row.name!,
    totalCost: row.totalAmountSpent ?? 0,
    quantity: Math.max(0, row.totalQuantity ?? 0),
    description: row.description?.trim() ?? '',
    lastPurchaseDate: row.lastPurchaseDate ?? null,
  }));
}

export function computeMonthSpendFromOrders(orders: OrderRecord[]): number {
  return orders.reduce((sum, order) => {
    const total = Number(order.totalPrice);
    return sum + (Number.isFinite(total) && total > 0 ? total : 0);
  }, 0);
}

export function normalizeTopProcuredItemsPayload(data: unknown): ProcuredItemRow[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.flatMap((entry): ProcuredItemRow[] => {
      const row = entry as { name?: string; summary?: { totalCost?: number } };
      const totalCost = Number(row.summary?.totalCost ?? 0);
      const name = typeof row.name === 'string' ? row.name.trim() : '';

      if (!name || !Number.isFinite(totalCost) || totalCost <= 0) {
        return [];
      }

      return [{
        name,
        totalCost,
        quantity: 0,
        description: '',
        lastPurchaseDate: null,
      }];
    });
}

export function normalizeTotalProcurementPayload(data: unknown): {
  items: ProcuredItemRow[];
  totalSpent: number;
} {
  const root = data as {
    totalAmountSpent?: number;
    procurementSummary?: Record<string, { amountSpent?: number; quantity?: number }>;
  };

  const summary = root?.procurementSummary ?? {};
  const items = Object.entries(summary).flatMap(([name, row]): ProcuredItemRow[] => {
      const totalCost = Number(row?.amountSpent ?? 0);
      const trimmed = name.trim();

      if (!trimmed || !Number.isFinite(totalCost) || totalCost <= 0) {
        return [];
      }

      const quantity = Number(row?.quantity ?? 0);
      return [{
        name: trimmed,
        totalCost,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        description: '',
        lastPurchaseDate: null,
      }];
    });

  const reportedTotal = Number(root?.totalAmountSpent ?? 0);
  const totalSpent =
    Number.isFinite(reportedTotal) && reportedTotal > 0
      ? reportedTotal
      : items.reduce((sum, row) => sum + row.totalCost, 0);

  return { items, totalSpent };
}

export function buildSpendingBreakdown(
  items: ProcuredItemRow[],
  totalSpent: number,
): SpendingBreakdownRow[] {
  if (items.length === 0) {
    return [];
  }

  const sorted = [...items].sort((a, b) => b.totalCost - a.totalCost);
  const lineTotal = sorted.reduce((sum, row) => sum + row.totalCost, 0);
  const grandTotal = totalSpent > 0 ? totalSpent : lineTotal;

  if (grandTotal <= 0) {
    return [];
  }

  const top = sorted.slice(0, PROCUREMENT_INSIGHT_TOP_ITEMS);
  const topTotal = top.reduce((sum, row) => sum + row.totalCost, 0);
  const otherTotal = Math.max(0, lineTotal - topTotal);

  const rows: SpendingBreakdownRow[] = top.map((row, index) => ({
    label: row.name,
    percent: (row.totalCost / grandTotal) * 100,
    barClass: BAR_CLASSES[Math.min(index, BAR_CLASSES.length - 1)]!,
  }));

  if (otherTotal > 0) {
    rows.push({
      label: 'Others',
      percent: (otherTotal / grandTotal) * 100,
      barClass: BAR_CLASSES[2]!,
    });
  }

  return roundBreakdownPercents(rows);
}

function roundBreakdownPercents(rows: SpendingBreakdownRow[]): SpendingBreakdownRow[] {
  if (rows.length === 0) {
    return rows;
  }

  const othersIndex = rows.findIndex((row) => row.label === 'Others');
  const rounded = rows.map((row, index) => {
    if (index === othersIndex) {
      return { ...row, percent: 0 };
    }

    return { ...row, percent: Math.max(1, Math.round(row.percent)) };
  });

  const assigned = rounded
    .filter((_, index) => index !== othersIndex)
    .reduce((sum, row) => sum + row.percent, 0);

  if (othersIndex >= 0) {
    rounded[othersIndex]!.percent = Math.max(1, 100 - assigned);
  }

  return rounded;
}

export function buildProcurementInsight(
  items: ProcuredItemRow[],
  totalSpent: number,
  periodLabel: string,
): ExploreProcurementInsightData {
  return {
    rows: buildSpendingBreakdown(items, totalSpent),
    totalSpent,
    periodLabel,
  };
}

export type ProcurementInsightFetchDeps = {
  listOrders: (query?: ListOrdersQuery) => Promise<OrderListResponse>;
  getTotalProcurement: (
    branchId: string,
    options: { startDate: string; endDate: string; quiet?: boolean },
  ) => Promise<{ data?: unknown } | null>;
  getTopProcuredItems: (
    branchId: string,
    options?: { quiet?: boolean },
  ) => Promise<{ data?: unknown } | null>;
  getProductAnalysis: (
    branchId: string,
    options: { startDate: string; endDate: string; quiet?: boolean },
  ) => Promise<{ data?: unknown } | null>;
};

function mergeProcurementInsightItems(
  analysisItems: ProcuredItemRow[],
  orderItems: ProcuredItemRow[],
): ProcuredItemRow[] {
  const orderByName = new Map(orderItems.map((row) => [row.name, row]));
  const merged = analysisItems.map((row) => {
    const orderRow = orderByName.get(row.name);
    if (!orderRow) {
      return row;
    }

    return {
      ...row,
      totalCost: orderRow.totalCost,
      quantity: orderRow.quantity,
      description: row.description || orderRow.description,
      lastPurchaseDate: row.lastPurchaseDate ?? orderRow.lastPurchaseDate,
    };
  });

  const analysisNames = new Set(analysisItems.map((row) => row.name));
  for (const orderRow of orderItems) {
    if (!analysisNames.has(orderRow.name)) {
      merged.push(orderRow);
    }
  }

  return merged;
}

/** Shared procurement totals for marketplace card and track-orders insight table. */
export async function fetchProcurementInsightForBranch(
  deps: ProcurementInsightFetchDeps,
  branchId: string,
  range: { startDate: string; endDate: string },
): Promise<{ items: ProcuredItemRow[]; totalSpent: number }> {
  const { orders } = await fetchBranchOrdersInRange(deps.listOrders, branchId, range);
  const orderItems = buildProcurementItemsFromOrders(orders);
  const orderTotal = computeMonthSpendFromOrders(orders);

  const analysisResponse = await deps.getProductAnalysis(branchId, { ...range, quiet: true });
  const analysisItems = procuredItemsFromProductAnalysis(
    normalizeProductAnalysisRows(analysisResponse?.data),
  );

  if (analysisItems.length > 0) {
    const items =
      orderItems.length > 0
        ? mergeProcurementInsightItems(analysisItems, orderItems)
        : analysisItems;
    const lineTotal = sumProcuredItemSpend(items);

    return {
      items,
      totalSpent: orderTotal > 0 ? orderTotal : lineTotal,
    };
  }

  if (orderItems.length > 0) {
    return {
      items: orderItems,
      totalSpent: orderTotal,
    };
  }

  const monthly = await deps.getTotalProcurement(branchId, { ...range, quiet: true });
  const monthlyPayload = normalizeTotalProcurementPayload(monthly?.data);

  if (monthlyPayload.items.length > 0) {
    return {
      items: monthlyPayload.items,
      totalSpent: monthlyPayload.totalSpent,
    };
  }

  const fallback = await deps.getTopProcuredItems(branchId, { quiet: true });
  const fallbackItems = normalizeTopProcuredItemsPayload(fallback?.data);

  if (fallbackItems.length === 0) {
    return { items: [], totalSpent: 0 };
  }

  return {
    items: fallbackItems,
    totalSpent: sumProcuredItemSpend(fallbackItems),
  };
}
