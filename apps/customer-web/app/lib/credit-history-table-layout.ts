import { CREDIT_REQUEST_TABLE_GRID_TEMPLATE } from '~/lib/customer-table-layout';

export const CREDIT_REPAYMENT_TABLE_GRID = '1.2fr 1fr 1fr 0.8fr';

export const CREDIT_REPAYMENT_SCHEDULE_TABLE_GRID = '0.6fr 1fr 1fr 1fr 1fr 0.8fr';

export const CREDIT_REQUEST_HISTORY_SKELETON_COLUMNS = [
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'w-28' },
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' },
  { kind: 'action' as const },
];

export const CREDIT_REPAYMENT_HISTORY_SKELETON_COLUMNS = [
  { kind: 'line' as const, lineClass: 'w-28' },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-28' },
  { kind: 'line' as const, lineClass: 'h-7 w-20 rounded-full' },
];

export { CREDIT_REQUEST_TABLE_GRID_TEMPLATE };
