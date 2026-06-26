export const MANAGE_REQUESTS_LIST_PATH = '/manage-requests';

/** Only allow returning to the manage-requests index (with optional query), never detail routes. */
export function sanitizeManageRequestsListReturn(path: string): string {
  if (!path || !path.startsWith(MANAGE_REQUESTS_LIST_PATH)) {
    return MANAGE_REQUESTS_LIST_PATH;
  }

  const remainder = path.slice(MANAGE_REQUESTS_LIST_PATH.length);
  if (remainder.startsWith('/')) {
    return MANAGE_REQUESTS_LIST_PATH;
  }

  return path;
}
