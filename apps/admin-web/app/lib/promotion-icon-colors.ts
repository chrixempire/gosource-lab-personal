export type PromotionIconColor = {
  name: string;
  value: string;
  bg: string;
  border: string;
};

/** Mirrors reference `gosource-admin-v2` icon picker palette. */
export const PROMOTION_ICON_COLORS: PromotionIconColor[] = [
  { name: 'slate', value: '#64748b', bg: '#f1f5f9', border: '#64748b' },
  { name: 'red', value: '#ef4444', bg: '#fee2e2', border: '#ef4444' },
  { name: 'orange', value: '#f97316', bg: '#ffedd5', border: '#f97316' },
  { name: 'amber', value: '#f59e0b', bg: '#fef3c7', border: '#f59e0b' },
  { name: 'yellow', value: '#eab308', bg: '#fef9c3', border: '#eab308' },
  { name: 'lime', value: '#84cc16', bg: '#ecfccb', border: '#84cc16' },
  { name: 'green', value: '#22c55e', bg: '#dcfce7', border: '#22c55e' },
  { name: 'emerald', value: '#10b981', bg: '#d1fae5', border: '#10b981' },
  { name: 'teal', value: '#14b8a6', bg: '#ccfbf1', border: '#14b8a6' },
  { name: 'cyan', value: '#06b6d4', bg: '#cffafe', border: '#06b6d4' },
  { name: 'sky', value: '#0ea5e9', bg: '#e0f2fe', border: '#0ea5e9' },
  { name: 'blue', value: '#3b82f6', bg: '#dbeafe', border: '#3b82f6' },
  { name: 'indigo', value: '#6366f1', bg: '#e0e7ff', border: '#6366f1' },
  { name: 'violet', value: '#8b5cf6', bg: '#ede9fe', border: '#8b5cf6' },
  { name: 'purple', value: '#a855f7', bg: '#f3e8ff', border: '#a855f7' },
  { name: 'fuchsia', value: '#d946ef', bg: '#fae8ff', border: '#d946ef' },
  { name: 'pink', value: '#ec4899', bg: '#fce7f3', border: '#ec4899' },
  { name: 'rose', value: '#f43f5e', bg: '#ffe4e6', border: '#f43f5e' },
];

export const DEFAULT_PROMOTION_ICON_COLOR = PROMOTION_ICON_COLORS[0]!.value;
