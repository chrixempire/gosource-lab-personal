export const ORDER_LIST_PANEL_CLASS =
  'flex flex-col overflow-hidden rounded-xl border border-grey-50 bg-white shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]';

export const ORDER_TABLE_GRID_TEMPLATE =
  '2.75rem minmax(0,1.1fr) minmax(0,0.85fr) minmax(0,0.95fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 2.5rem';

export const ORDER_TABLE_SKELETON_COLUMNS = [
  { kind: 'line' as const, lineClass: 'w-5' },
  { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-4/5' },
  { kind: 'stack' as const, lineClass: 'w-20', sublineClass: 'w-14' },
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'h-7 w-28 rounded-full' },
  { kind: 'line' as const, lineClass: 'w-28' },
  { kind: 'line' as const, lineClass: 'h-7 w-28 rounded-full' },
  { kind: 'line' as const, lineClass: 'w-8' },
];
