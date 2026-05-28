import { formatCustomerTableDateTime } from '~/lib/customer-date-display';
import {
  normalizeProductAnalysisRows,
  type ProcuredItemRow,
} from '~/lib/explore-procurement-insight';

const INSIGHT_BAR_CLASSES = [
  'bg-primary-500',
  'bg-negative-500',
  'bg-grey-300',
  'bg-orange-brick',
] as const;

/** Same rounded share % always maps to the same bar color within a table. */
export function buildInsightPercentBarClassMap(percents: number[]) {
  const uniquePercents = [...new Set(percents)].sort((a, b) => b - a);
  const map = new Map<number, string>();

  uniquePercents.forEach((percent, index) => {
    map.set(percent, INSIGHT_BAR_CLASSES[index % INSIGHT_BAR_CLASSES.length]!);
  });

  return map;
}

export type ProcurementInsightTableRow = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  totalSpent: number;
  percent: number;
  barClass: string;
  lastPurchaseLabel: string;
  lastPurchaseIso: string | null;
};

export function formatInsightPurchaseDate(value: string | Date | null | undefined) {
  return formatCustomerTableDateTime(value);
}

export function buildProcurementInsightTableRowsFromProcuredItems(
  items: ProcuredItemRow[],
  totalSpent: number,
): ProcurementInsightTableRow[] {
  if (items.length === 0) {
    return [];
  }

  const sorted = [...items].sort((a, b) => b.totalCost - a.totalCost);
  const lineTotal = sorted.reduce((sum, row) => sum + row.totalCost, 0);
  const grandTotal = totalSpent > 0 ? totalSpent : lineTotal;

  if (grandTotal <= 0) {
    return [];
  }

  const percents = sorted.map((row) =>
    Math.max(1, Math.round((row.totalCost / grandTotal) * 100)),
  );
  const barClassByPercent = buildInsightPercentBarClassMap(percents);

  return sorted.map((row, index) => {
    const percent = percents[index]!;
    const purchaseDate = row.lastPurchaseDate ?? null;
    const purchaseIso =
      purchaseDate instanceof Date
        ? purchaseDate.toISOString()
        : purchaseDate
          ? String(purchaseDate)
          : null;
    const description = row.description?.trim();

    return {
      id: `${row.name}-${index}`,
      name: row.name,
      description: description || '—',
      quantity: row.quantity,
      totalSpent: row.totalCost,
      percent,
      barClass: barClassByPercent.get(percent) ?? INSIGHT_BAR_CLASSES[0]!,
      lastPurchaseLabel: formatInsightPurchaseDate(purchaseDate),
      lastPurchaseIso: purchaseIso,
    };
  });
}

export function buildProcurementInsightTableRows(
  items: ReturnType<typeof normalizeProductAnalysisRows>,
): ProcurementInsightTableRow[] {
  if (items.length === 0) {
    return [];
  }

  const sorted = [...items].sort((a, b) => b.totalAmountSpent! - a.totalAmountSpent!);
  const grandTotal = sorted.reduce((sum, row) => sum + (row.totalAmountSpent ?? 0), 0);

  if (grandTotal <= 0) {
    return [];
  }

  const percents = sorted.map((row) =>
    Math.max(1, Math.round(((row.totalAmountSpent ?? 0) / grandTotal) * 100)),
  );
  const barClassByPercent = buildInsightPercentBarClassMap(percents);

  return sorted.map((row, index) => {
    const totalSpent = row.totalAmountSpent ?? 0;
    const purchaseDate = row.lastPurchaseDate ?? null;
    const purchaseIso =
      purchaseDate instanceof Date
        ? purchaseDate.toISOString()
        : purchaseDate
          ? String(purchaseDate)
          : null;
    const percent = percents[index]!;

    return {
      id: `${row.name}-${index}`,
      name: row.name!,
      description: row.description?.trim() || '—',
      quantity: Math.max(0, row.totalQuantity ?? 0),
      totalSpent,
      percent,
      barClass: barClassByPercent.get(percent) ?? INSIGHT_BAR_CLASSES[0]!,
      lastPurchaseLabel: formatInsightPurchaseDate(purchaseDate),
      lastPurchaseIso: purchaseIso,
    };
  });
}
