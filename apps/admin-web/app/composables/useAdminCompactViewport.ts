import { useMediaQuery } from '@vueuse/core';

/**
 * Admin mobile breakpoint (matches customer-web).
 * Below 1000px: use card layouts for tables — never a separate scrolling table layout.
 * At/above 1000px: standard TableShell grid.
 */
export function useAdminCompactViewport() {
  return useMediaQuery('(max-width: 999px)');
}
