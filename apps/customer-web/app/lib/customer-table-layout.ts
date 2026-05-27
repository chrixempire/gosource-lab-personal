export const CUSTOMER_TABLE_PANEL_CLASS =
  'flex w-full flex-col overflow-hidden rounded-xl border border-grey-50 bg-white shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]';

/** Matches CustomerAppShell main padding (py-4 / lg:py-6) so header sticks under the app bar. */
export const CUSTOMER_TABLE_STICKY_HEADER_CLASS =
  'sticky -top-4 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)] lg:-top-6';

/** Page scroll instead of an inner table body scroll region (default TableBody is max-h 560px). */
export const CUSTOMER_TABLE_BODY_CLASS = '!max-h-none !overflow-visible';
