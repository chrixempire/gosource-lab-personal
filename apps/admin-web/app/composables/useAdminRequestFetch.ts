/**
 * Same-origin fetch that forwards the incoming request cookies during SSR.
 * Use in composables instead of bare `$fetch` for protected `/api` routes.
 */
export function useAdminRequestFetch() {
  return useRequestFetch();
}
