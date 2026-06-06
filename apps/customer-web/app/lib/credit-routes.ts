export const CREDIT_PAGE_ROUTES = {
  HOME: '/credit',
  APPLY: '/credit/apply',
} as const;

export function creditRequestPath(requestId: string) {
  return `/credit/requests/${requestId}`;
}
