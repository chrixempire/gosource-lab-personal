export {
  CUSTOMER_TABLE_PANEL_CLASS as ORDER_LIST_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS as ORDER_TABLE_STICKY_HEADER_CLASS,
} from './customer-table-layout';

export const ORDER_TABLE_GRID_TEMPLATE =
  'minmax(0,2fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,0.85fr) minmax(0,1.1fr) minmax(0,1fr) 3rem';

export const ORDER_TABLE_SKELETON_COLUMNS = [
  {
    kind: 'stack' as const,
    avatar: true,
    lineClass: 'w-full',
    sublineClass: 'w-4/5',
  },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-16' },
  { kind: 'line' as const, lineClass: 'w-24' },
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' },
  { kind: 'line' as const, lineClass: 'h-8 w-14' },
];
