export {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS as REQUEST_LIST_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS as REQUEST_TABLE_STICKY_HEADER_CLASS,
} from './customer-table-layout';

export const REQUEST_TABLE_GRID_TEMPLATE =
  'minmax(0,1.35fr) minmax(0,0.95fr) minmax(0,0.9fr) minmax(0,0.8fr) minmax(0,0.85fr) minmax(0,0.85fr) 3rem';

export const REQUEST_TABLE_SKELETON_COLUMNS = [
  {
    kind: 'stack' as const,
    avatar: true,
    lineClass: 'w-full',
    sublineClass: 'w-4/5',
  },
  { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-4/5' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'h-8 w-24 rounded-[10px]' },
  { kind: 'action' as const },
];
