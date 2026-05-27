import type { OrderRecord } from '@gosource/api-client';

export type ProcuredItemRow = {
  name: string;
  totalCost: number;
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
/** Max product lines shown; remaining spend rolls into "Others". */
export const PROCUREMENT_INSIGHT_TOP_ITEMS = 4;

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

export function buildProcurementItemsFromOrders(orders: OrderRecord[]): ProcuredItemRow[] {
  const totals = new Map<string, number>();

  for (const order of orders) {
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

      totals.set(name, (totals.get(name) ?? 0) + amount);
    }
  }

  return [...totals.entries()].map(([name, totalCost]) => ({ name, totalCost }));
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

  return data
    .map((entry) => {
      const row = entry as { name?: string; summary?: { totalCost?: number } };
      const totalCost = Number(row.summary?.totalCost ?? 0);
      const name = typeof row.name === 'string' ? row.name.trim() : '';

      if (!name || !Number.isFinite(totalCost) || totalCost <= 0) {
        return null;
      }

      return { name, totalCost };
    })
    .filter((row): row is ProcuredItemRow => row !== null);
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
  const items = Object.entries(summary)
    .map(([name, row]) => {
      const totalCost = Number(row?.amountSpent ?? 0);
      const trimmed = name.trim();

      if (!trimmed || !Number.isFinite(totalCost) || totalCost <= 0) {
        return null;
      }

      return { name: trimmed, totalCost };
    })
    .filter((row): row is ProcuredItemRow => row !== null);

  const reportedTotal = Number(root?.totalAmountSpent ?? 0);
  const totalSpent =
    Number.isFinite(reportedTotal) && reportedTotal > 0
      ? reportedTotal
      : items.reduce((sum, row) => sum + row.totalCost, 0);

  return { items, totalSpent };
}

export function buildSpendingBreakdown(items: ProcuredItemRow[]): SpendingBreakdownRow[] {
  if (items.length === 0) {
    return [];
  }

  const sorted = [...items].sort((a, b) => b.totalCost - a.totalCost);
  const grandTotal = sorted.reduce((sum, row) => sum + row.totalCost, 0);

  if (grandTotal <= 0) {
    return [];
  }

  const top = sorted.slice(0, PROCUREMENT_INSIGHT_TOP_ITEMS);
  const topTotal = top.reduce((sum, row) => sum + row.totalCost, 0);
  const otherTotal = grandTotal - topTotal;

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

  const rounded = rows.map((row, index) => ({
    ...row,
    percent:
      index === rows.length - 1
        ? 0
        : Math.max(1, Math.round(row.percent)),
  }));

  const assigned = rounded.slice(0, -1).reduce((sum, row) => sum + row.percent, 0);
  rounded[rounded.length - 1]!.percent = Math.max(1, 100 - assigned);

  return rounded;
}

export function buildProcurementInsight(
  items: ProcuredItemRow[],
  totalSpent: number,
  periodLabel: string,
): ExploreProcurementInsightData {
  return {
    rows: buildSpendingBreakdown(items),
    totalSpent,
    periodLabel,
  };
}
