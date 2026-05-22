import { DateFilterType } from '../product/enum/product.enum';

export const DASHBOARD_PIE_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'partially_delivered',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
  'other',
] as const;

export type DashboardPieStatus = (typeof DASHBOARD_PIE_STATUSES)[number];

export function mapOrderStatusToPieBucket(status: string): DashboardPieStatus {
  const normalized = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (normalized === 'pending') {
    return 'pending';
  }

  if (normalized === 'processing') {
    return 'processing';
  }

  if (normalized === 'shipped') {
    return 'shipped';
  }

  if (
    normalized === 'partially_delivered' ||
    normalized === 'partial' ||
    normalized === 'partial_delivery'
  ) {
    return 'partially_delivered';
  }

  if (normalized === 'delivered') {
    return 'delivered';
  }

  if (normalized === 'completed') {
    return 'completed';
  }

  if (normalized === 'cancelled' || normalized === 'canceled') {
    return 'cancelled';
  }

  if (normalized === 'refunded') {
    return 'refunded';
  }

  return 'other';
}

export function getTrendDateBucketFormat(
  filterType: DateFilterType | undefined,
): string {
  switch (filterType) {
    case DateFilterType.CURRENT_DATE:
    case DateFilterType.YESTERDAY:
      return '%Y-%m-%d %H:00';
    case DateFilterType.THIS_WEEK:
    case DateFilterType.LAST_WEEK:
    case DateFilterType.LAST_7_DAYS:
    case DateFilterType.THIS_MONTH:
    case DateFilterType.LAST_MONTH:
    case DateFilterType.CUSTOM_RANGE:
      return '%Y-%m-%d';
    case DateFilterType.THIS_YEAR:
    case DateFilterType.LAST_YEAR:
    case DateFilterType.ALL_TIME:
    default:
      return '%Y-%m';
  }
}
