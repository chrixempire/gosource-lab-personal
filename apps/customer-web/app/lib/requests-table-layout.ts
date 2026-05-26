export const REQUEST_LIST_PANEL_CLASS =
  'flex w-full flex-col overflow-hidden rounded-xl border border-grey-50 bg-white shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]';

/** Matches CustomerAppShell main padding (py-4 / lg:py-6) so header sticks under the app bar. */
export const REQUEST_TABLE_STICKY_HEADER_CLASS =
  'sticky -top-4 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)] lg:-top-6';

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
