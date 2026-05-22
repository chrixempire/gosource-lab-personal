import { formatDashboardCurrency } from '~/lib/dashboard-date';
import {
  DISCOUNT_AMOUNT_TYPE_OPTIONS,
  DISCOUNT_CATEGORY_LABELS,
  discountStatusLabel,
} from '~/lib/discount-constants';
import { unwrapInventoryData } from '~/lib/inventory-api';
import type {
  AdminDiscountListItem,
  DiscountStatus,
  LegacyCouponRow,
} from '~/types/discounts';
import type { InventoryTableMeta } from '~/types/inventory';

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

export function computeDiscountStatus(coupon: LegacyCouponRow): DiscountStatus {
  const now = Date.now();
  const start = coupon.startDate ? new Date(coupon.startDate).getTime() : 0;
  const end = coupon.endDate ? new Date(coupon.endDate).getTime() : null;
  const usageLimit = coupon.usageLimit ?? -1;
  const usageCount = coupon.usageCount ?? 0;
  const isActive = coupon.isActive !== false;

  if (now < start && isActive) {
    return 'inactive';
  }
  if (end && now > end) {
    return 'expired';
  }
  if (usageLimit > 0 && usageCount >= usageLimit) {
    return 'used';
  }
  if (!isActive) {
    return 'deactivated';
  }
  if (isActive) {
    return 'active';
  }
  return 'inactive';
}

export function buildDiscountDescription(coupon: LegacyCouponRow) {
  const amount = coupon.discount ?? 0;
  const category = coupon.category ?? '';
  const min = coupon.minimumOrderAmount ?? 0;
  const amountText =
    coupon.type === 'PERCENTAGE' ? `${amount}% off` : formatDashboardCurrency(amount);

  if (category === 'amount_off_items') {
    const count = coupon.applicableItems?.length ?? 0;
    return `${amountText} on ${count || 'selected'} product(s)`;
  }
  if (category === 'amount_off_orders') {
    return min > 0
      ? `${amountText} orders above ${formatDashboardCurrency(min)}`
      : `${amountText} on orders`;
  }
  if (category === 'free_delivery') {
    return min > 0
      ? `Free delivery on orders above ${formatDashboardCurrency(min)}`
      : 'Free delivery on orders';
  }
  if (category === 'amount_off_category') {
    return `${amountText} on category items`;
  }
  return amountText;
}

export function mapLegacyCouponToListItem(coupon: LegacyCouponRow): AdminDiscountListItem {
  const id = String(coupon._id ?? coupon.id ?? '');
  const usageLimit = coupon.usageLimit ?? 0;
  const usageCount = coupon.usageCount ?? 0;
  const status = computeDiscountStatus(coupon);
  const category = String(coupon.category ?? '');
  const type = String(coupon.type ?? '');

  return {
    id,
    code: coupon.code ?? '—',
    description: buildDiscountDescription(coupon),
    category,
    categoryLabel: DISCOUNT_CATEGORY_LABELS[category] ?? category,
    type,
    typeLabel:
      DISCOUNT_AMOUNT_TYPE_OPTIONS.find((entry) => entry.value === type)?.label ?? type,
    discount: coupon.discount ?? 0,
    minimumOrderAmount: coupon.minimumOrderAmount ?? 0,
    usageLimit,
    usageCount,
    usagePercent: usageLimit > 0 ? Math.round((usageCount / usageLimit) * 100) : 0,
    status,
    statusLabel: discountStatusLabel(status),
    expiryDate: coupon.endDate ?? coupon.expiryDate ?? null,
    expiryDateLabel: formatDateLabel(coupon.endDate ?? coupon.expiryDate),
    isActive: coupon.isActive !== false,
  };
}

export function parseDiscountsListResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
) {
  const body = unwrapInventoryData(payload);
  const coupons = Array.isArray(body?.coupons) ? (body.coupons as LegacyCouponRow[]) : [];

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

  const rows = coupons.map(mapLegacyCouponToListItem);

  return { rows, meta };
}

export function parseDiscountDetail(payload: unknown): LegacyCouponRow | null {
  const body = unwrapInventoryData(payload);
  if (!body) {
    return null;
  }
  if (body._id || body.id) {
    return body as LegacyCouponRow;
  }
  return null;
}

export function filterDiscountsByStatus(
  rows: AdminDiscountListItem[],
  statusFilter: DiscountStatus[],
) {
  if (statusFilter.length === 0) {
    return rows;
  }
  return rows.filter((row) => statusFilter.includes(row.status));
}

export function filterDiscountsByType(rows: AdminDiscountListItem[], types: string[]) {
  if (types.length === 0) {
    return rows;
  }
  return rows.filter((row) => types.includes(row.type));
}

export function computeDiscountStats(rows: AdminDiscountListItem[]) {
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === 'active').length,
    inactive: rows.filter((row) => row.status === 'inactive').length,
    expired: rows.filter((row) => row.status === 'expired').length,
    deactivated: rows.filter((row) => row.status === 'deactivated').length,
    used: rows.filter((row) => row.status === 'used').length,
  };
}
