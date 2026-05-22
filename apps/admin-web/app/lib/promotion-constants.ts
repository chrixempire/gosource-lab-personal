import type { PromotionStatus } from '~/types/promotions';

export const PROMOTION_STATUS_OPTIONS: {
  value: PromotionStatus;
  label: string;
  variant: 'success' | 'warning' | 'default' | 'completed' | 'negative';
}[] = [
  { value: 'active', label: 'Active', variant: 'success' },
  { value: 'inactive', label: 'Inactive', variant: 'negative' },
  { value: 'expired', label: 'Expired', variant: 'warning' },
  { value: 'deactivated', label: 'Deactivated', variant: 'default' },
];

export const PROMOTION_FILTER_STATUS_OPTIONS = PROMOTION_STATUS_OPTIONS.filter(
  (entry) => entry.value !== 'deactivated',
);

export const PROMOTION_QUICK_STATUS_FILTERS: { key: PromotionStatus | 'all'; label: string }[] =
  [
    { key: 'all', label: 'All promotions' },
    { key: 'active', label: 'Active promotions' },
    { key: 'inactive', label: 'Inactive promotions' },
  ];

export function promotionStatusLabel(status: string) {
  return PROMOTION_STATUS_OPTIONS.find((entry) => entry.value === status)?.label ?? status;
}

export function promotionStatusVariant(status: string) {
  return PROMOTION_STATUS_OPTIONS.find((entry) => entry.value === status)?.variant ?? 'default';
}
