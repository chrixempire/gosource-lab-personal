/** Shared layout classes for credit list toolbars (search + filter row). */
export const CREDIT_LIST_TOOLBAR_CLASS = 'flex flex-col gap-4';
/** Full width on small screens; ~35% of the content area from sm breakpoint up. */
export const CREDIT_LIST_SEARCH_CLASS = 'w-full min-w-0 sm:w-[35%] sm:max-w-none';
/** Search row with optional view toggle on desktop. */
export const CREDIT_LIST_VIEW_TOOLBAR_CLASS =
  'flex flex-col gap-4 min-[1000px]:flex-row min-[1000px]:items-end min-[1000px]:justify-between';
export const CREDIT_CARDS_GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3';
export const CREDIT_CARD_SHELL_CLASS =
  'box-border flex h-full w-full min-w-0 cursor-pointer flex-col rounded-[24px] border border-grey-50 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(16,24,40,0.12)] transition-colors duration-150 hover:border-primary-100 hover:bg-primary-50/50 sm:p-5';
export const CREDIT_CARD_SKELETON_CLASS =
  'h-56 animate-pulse rounded-[24px] border border-grey-50 bg-grey-55';
/** Bordered shell for card-view pagination (matches inventory list card grids). */
export const CREDIT_LIST_PAGINATION_PANEL_CLASS =
  'overflow-hidden rounded-xl border border-grey-50 bg-white';
