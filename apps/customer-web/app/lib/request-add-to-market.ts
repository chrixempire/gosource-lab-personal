import type { RequestRecord } from '@gosource/api-client';

export const REQUEST_ADD_TO_MARKET_QUERY = 'addToRequest';
export const REQUEST_OPEN_DRAWER_QUERY = 'openRequestDrawer';

export function parseRouteQueryParam(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return '';
}

export function buildMarketAddToRequestLocation(requestId: string) {
  return {
    path: '/market',
    query: {
      [REQUEST_ADD_TO_MARKET_QUERY]: requestId,
      [REQUEST_OPEN_DRAWER_QUERY]: '1',
    },
  };
}

export async function navigateToMarketAddToRequest(
  router: ReturnType<typeof useRouter>,
  request: RequestRecord,
  setActiveRequest: (request: RequestRecord) => void,
) {
  setActiveRequest(request);
  await router.push(buildMarketAddToRequestLocation(request.id));
}
