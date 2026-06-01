/**
 * At this viewport width and below, category grids use fixed-width cards
 * and horizontal scroll for the 3rd column.
 */
export const EXPLORE_MOBILE_TRIPLE_SCROLL_MAX_PX = 600;

/** Between scroll max and desktop min: 3 equal columns, no horizontal scroll. */
export const EXPLORE_DESKTOP_PRODUCT_GRID_MIN_PX = 900;

export const exploreMobileTripleScrollMediaQuery = `(max-width: ${EXPLORE_MOBILE_TRIPLE_SCROLL_MAX_PX}px)`;

/** Explore / category product card width on ≤600px (must match promotions rail). */
export const EXPLORE_MOBILE_PRODUCT_CARD_WIDTH_PX = 182;
export const EXPLORE_MOBILE_PRODUCT_CARD_WIDTH_REM = '11.375rem';
export const EXPLORE_MOBILE_PRODUCT_CARD_GAP_PX = 12;
export const EXPLORE_MOBILE_PRODUCT_CARD_GAP_REM = '0.75rem';

/** Promotion horizontal rail card width above the narrow mobile breakpoint. */
export const EXPLORE_PROMOTION_RAIL_CARD_WIDTH_PX = 220;
