export const PROCUREMENT_INSIGHT_TABLE_GRID_TEMPLATE =
  'minmax(0,2.2fr) minmax(0,0.7fr) minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr)';

export const PROCUREMENT_INSIGHT_TABLE_GRID_TEMPLATE_WITH_BRANCH =
  'minmax(0,2fr) minmax(0,1.1fr) minmax(0,0.7fr) minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr)';

export const PROCUREMENT_INSIGHT_TABLE_SKELETON_COLUMNS = [
  {
    kind: 'stack' as const,
    lineClass: 'w-full',
    sublineClass: 'w-4/5',
  },
  { kind: 'line' as const, lineClass: 'w-12' },
  { kind: 'line' as const, lineClass: 'w-20' },
  {
    kind: 'stack' as const,
    lineClass: 'w-10',
    sublineClass: 'w-full h-2 rounded-full',
  },
  { kind: 'line' as const, lineClass: 'w-24' },
];

export const PROCUREMENT_INSIGHT_TABLE_SKELETON_COLUMNS_WITH_BRANCH = [
  {
    kind: 'stack' as const,
    lineClass: 'w-full',
    sublineClass: 'w-4/5',
  },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-12' },
  { kind: 'line' as const, lineClass: 'w-20' },
  {
    kind: 'stack' as const,
    lineClass: 'w-10',
    sublineClass: 'w-full h-2 rounded-full',
  },
  { kind: 'line' as const, lineClass: 'w-24' },
];
