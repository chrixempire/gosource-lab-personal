export const CUSTOMER_TABLE_PANEL_CLASS =
  'flex w-full flex-col overflow-hidden rounded-xl border border-grey-50 bg-background-on-canvas shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]';

/** Matches CustomerAppShell main padding (py-4 / lg:py-6) so header sticks under the app bar. */
export const CUSTOMER_TABLE_STICKY_HEADER_CLASS =
  'sticky -top-4 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)] lg:-top-6';

/** Page scroll instead of an inner table body scroll region (default TableBody is max-h 560px). */
export const CUSTOMER_TABLE_BODY_CLASS = '!max-h-none !overflow-visible';

/** Clickable data rows: white background with green hover in light and dark mode. */
export const CUSTOMER_TABLE_DATA_ROW_CLASS =
  'cursor-pointer bg-white transition-colors duration-150 hover:bg-primary-50/45 dark:bg-white dark:hover:bg-primary-500/10';

/** Non-interactive data rows (e.g. insight breakdown). */
export const CUSTOMER_TABLE_STRIPED_ROW_CLASS = 'bg-white dark:bg-white';

export const CREDIT_REQUEST_TABLE_GRID_TEMPLATE =
  '1.2fr 1fr 1fr 1fr 0.8fr 1fr auto';
