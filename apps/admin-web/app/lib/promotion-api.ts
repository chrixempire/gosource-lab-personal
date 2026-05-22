import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import { parseInventoryTableMeta } from '~/lib/inventory-api';
import { promotionStatusLabel } from '~/lib/promotion-constants';
import type {
  AdminPromotionListItem,
  LegacyPromotionRow,
  PromotionListStats,
  PromotionStatus,
} from '~/types/promotions';
import type { InventoryTableMeta } from '~/types/inventory';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function computePromotionStatus(row: LegacyPromotionRow): PromotionStatus {
  const now = Date.now();
  const start = row.startDate ? new Date(row.startDate).getTime() : 0;
  const end = row.endDate ? new Date(row.endDate).getTime() : null;
  const isActive = row.isActive !== false;

  if (now < start && !isActive) {
    return 'inactive';
  }
  if (end && now > end) {
    return 'expired';
  }
  return isActive ? 'active' : 'deactivated';
}

function productCount(row: LegacyPromotionRow) {
  return Array.isArray(row.products) ? row.products.length : 0;
}

function discountLabel(row: LegacyPromotionRow) {
  if (!row.isPercentageDiscounted) {
    return '—';
  }
  const value = row.discountValue ?? 0;
  return `${value}% off`;
}

export function mapLegacyPromotionToListItem(row: LegacyPromotionRow): AdminPromotionListItem {
  const id = String(row._id ?? row.id ?? '');
  const status = computePromotionStatus(row);

  return {
    id,
    name: row.name ?? '—',
    description: row.description ?? '',
    usageCount: row.usageCount ?? 0,
    itemsCount: productCount(row),
    discountLabel: discountLabel(row),
    status,
    statusLabel: promotionStatusLabel(status),
    isActive: row.isActive !== false,
  };
}

export function parsePromotionsListResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
) {
  const body = unwrapLegacyPayload(payload);
  const rowsRaw = Array.isArray(body?.data) ? (body.data as LegacyPromotionRow[]) : [];
  const meta: InventoryTableMeta = parseInventoryTableMeta(body, {
    page: fallbackPage,
    limit: fallbackLimit,
  });

  const statsRecord = asRecord(body?.stats);
  const stats: PromotionListStats = {
    total: meta.total,
    active: Number(statsRecord?.totalActive) || 0,
    inactive: Number(statsRecord?.totalInactive) || 0,
    usage: Number(statsRecord?.usage) || 0,
  };

  return {
    rows: rowsRaw.map(mapLegacyPromotionToListItem),
    meta,
    stats,
  };
}

export function parsePromotionDetail(payload: unknown): LegacyPromotionRow | null {
  const body = unwrapLegacyPayload(payload);
  if (!body) {
    return null;
  }
  if (body._id || body.id) {
    return body as LegacyPromotionRow;
  }
  return null;
}

export function filterPromotionsByStatus(
  rows: AdminPromotionListItem[],
  statusFilter: PromotionStatus[],
) {
  if (statusFilter.length === 0) {
    return rows;
  }
  return rows.filter((row) => statusFilter.includes(row.status));
}
