/**
 * Same-origin admin API fetch. Uses global `$fetch` with silent refresh + retry
 * (see `admin-api-fetch.client` plugin and POST `/api/auth/session/refresh`).
 */
export async function adminApiFetch<T>(url: string, options?: Parameters<typeof $fetch<T>>[1]) {
  return $fetch<T>(url, options);
}
