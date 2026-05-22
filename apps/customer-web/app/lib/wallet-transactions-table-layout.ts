export const WALLET_TRANSACTIONS_TABLE_GRID =
  '44px minmax(0,1.2fr) minmax(0,0.85fr) minmax(0,1fr) minmax(0,0.7fr) minmax(0,0.75fr) minmax(0,0.85fr)';

export const WALLET_TRANSACTIONS_SKELETON_COLUMNS = [
  { kind: 'checkbox' as const },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-16' },
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' },
  { kind: 'line' as const, lineClass: 'w-24' },
];
