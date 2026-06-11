import {
  createError,
  getMethod,
  getQuery,
  getRequestHeader,
  getRequestURL,
  readRawBody,
  setResponseHeader,
  setResponseStatus,
} from 'h3';
import {
  fetchCustomerMe,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  getCustomerSessionSnapshot,
  refreshCustomerSession,
} from '../../utils/customer-auth-session';
import { getCustomerApiBaseUrl, isLegacyCustomerApiMode } from '../../utils/customer-api-mode';
import {
  assertMemberCanViewRequest,
  scopeRequestListForSnapshot,
} from '../../utils/customer-request-access';
import { forwardApiError } from '../../utils/forward-api-error';
import { getProxyRouteRule } from '../../utils/proxy-route-allowlist';
import {
  normalizeLegacyBranchDeleteResponse,
  normalizeLegacyBranchListResponse,
  normalizeLegacyBranchMembersResponse,
  normalizeLegacyBranchResponse,
  normalizeLegacyCancelInviteResponse,
  normalizeLegacyCartMutationResponse,
  normalizeLegacyCartResponse,
  normalizeLegacyEmployeeDeleteResponse,
  normalizeLegacyEmployeeResponse,
  normalizeLegacyInvitationDetails,
  normalizeLegacyInviteResponse,
  normalizeLegacyMarketCategoriesResponse,
  normalizeLegacyMarketCategoryResponse,
  normalizeLegacyMarketProductResponse,
  normalizeLegacyMarketPromotionsResponse,
  normalizeLegacyMarketRecentOrdersResponse,
  normalizeLegacyCreateRequestResponse,
  normalizeLegacyRequestListResponse,
  normalizeLegacyApproveRequestResponse,
  normalizeLegacyRequestResponse,
  normalizeLegacyVerifyBvnResponse,
  normalizeLegacyWalletActionResponse,
  normalizeLegacyWalletResponse,
  normalizeLegacyWalletTransactionsResponse,
  normalizeLegacyOrderListResponse,
  normalizeLegacyOrderResponse,
  normalizeLegacyOrderTimelineResponse,
  normalizeLegacyShoppingListActionResponse,
  normalizeLegacyShoppingListListResponse,
  normalizeLegacyShoppingListMoveResponse,
  normalizeLegacyShoppingListResponse,
  toLegacyCreateRequestBody,
  toLegacyOrderListQuery,
  toLegacyRequestListQuery,
} from '../../utils/legacy-resource-compat';

function buildTargetUrl(baseUrl: string, pathSegments: string[], query: Record<string, unknown>) {
  const normalizedBase = `${baseUrl.replace(/\/$/, '')}/`;
  let baseParsed: URL;
  try {
    baseParsed = new URL(normalizedBase);
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'API base URL is misconfigured',
    });
  }

  const joinedPath = pathSegments.join('/');
  const target = new URL(joinedPath, normalizedBase);

  if (target.origin !== baseParsed.origin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Proxy requests must target the configured API origin',
    });
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        target.searchParams.append(key, String(item));
      }
      continue;
    }

    target.searchParams.set(key, String(value));
  }

  return target.toString();
}

function copyAllowedHeaders(event: Parameters<typeof getRequestHeader>[0]) {
  const headers = new Headers();
  const contentType = getRequestHeader(event, 'content-type');
  const accept = getRequestHeader(event, 'accept');
  const idempotencyKey = getRequestHeader(event, 'idempotency-key');
  const authorization = getRequestHeader(event, 'authorization');

  if (contentType) headers.set('content-type', contentType);
  if (accept) headers.set('accept', accept);
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);
  if (authorization) headers.set('authorization', authorization);

  return headers;
}

export default defineEventHandler(async (event) => {
  const pathParam = event.context.params?.path;
  const pathSegments = Array.isArray(pathParam)
    ? pathParam
    : typeof pathParam === 'string' && pathParam.length > 0
      ? pathParam.split('/').filter(Boolean)
      : [];

  if (pathSegments.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A proxy path is required',
    });
  }

  const method = getMethod(event);
  const routeRule = getProxyRouteRule(method, pathSegments);

  if (!routeRule) {
    throw createError({
      statusCode: 403,
      statusMessage: 'This proxy route is not allowed',
    });
  }

  const targetBaseUrl = isLegacyCustomerApiMode(event)
    ? getCustomerApiBaseUrl(event)
    : useRuntimeConfig(event).public.apiBaseUrl;
  let targetPathSegments = [...pathSegments];
  const query = getQuery(event);
  const headers = copyAllowedHeaders(event);
  const hasExplicitAuthorization = headers.has('authorization');

  if (hasExplicitAuthorization && !routeRule.allowExplicitAuthorization) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Explicit authorization is not allowed for this proxy route',
    });
  }

  let accessToken = hasExplicitAuthorization ? null : getAccessTokenCookie(event);
  const refreshToken = hasExplicitAuthorization ? null : getRefreshTokenCookie(event);
  const sessionSnapshot = hasExplicitAuthorization ? null : getCustomerSessionSnapshot(event);

  if (!hasExplicitAuthorization && !accessToken && refreshToken) {
    const refreshed = await refreshCustomerSession(event);
    const nextAccessToken = isLegacyCustomerApiMode(event)
      ? refreshToken
      : getAccessTokenCookie(event);
    await fetchCustomerMe(event, nextAccessToken);
    accessToken = nextAccessToken;
    if (!refreshed?.data || !accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No active session was found',
      });
    }
  }

  if (accessToken && !hasExplicitAuthorization) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }

  const rawBody =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await readRawBody(event, false);

  let parsedBody: Record<string, unknown> | undefined;
  if (rawBody && typeof rawBody === 'string') {
    try {
      const candidate = JSON.parse(rawBody);
      if (typeof candidate === 'object' && candidate !== null) {
        parsedBody = candidate as Record<string, unknown>;
      }
    } catch {}
  }

  if (isLegacyCustomerApiMode(event)) {
    if (
      method === 'DELETE' &&
      targetPathSegments[0] === 'employee' &&
      targetPathSegments[1] === 'invite' &&
      targetPathSegments[2]
    ) {
      targetPathSegments = ['employee', 'delete-pending-invite', targetPathSegments[2]];
    }

    if (
      method === 'PATCH' &&
      targetPathSegments[0] === 'employee' &&
      targetPathSegments[2] === 'reactivate'
    ) {
      targetPathSegments = ['employee', targetPathSegments[1]!, 'reactivate'];
    }

    if (
      method === 'POST' &&
      targetPathSegments[0] === 'employee' &&
      targetPathSegments[1] === 'invite' &&
      (targetPathSegments[3] === 'resend' || targetPathSegments[3] === 'link')
    ) {
      const callbackUrl = `${getRequestURL(event).origin}/auth/invite-user`;
      parsedBody = {
        ...(parsedBody ?? {}),
        callbackUrl,
      };
      headers.set('content-type', 'application/json');
    }

    if (
      method === 'POST' &&
      targetPathSegments[0] === 'request' &&
      parsedBody &&
      (targetPathSegments.length === 1 ||
        (targetPathSegments.length === 3 && targetPathSegments[1] === 'shopping-list'))
    ) {
      parsedBody = toLegacyCreateRequestBody(parsedBody);
      headers.set('content-type', 'application/json');
    }
  }

  let proxyQuery: Record<string, unknown> = { ...query };
  if (
    isLegacyCustomerApiMode(event) &&
    method === 'GET' &&
    targetPathSegments[0] === 'request' &&
    targetPathSegments.length === 1
  ) {
    proxyQuery = toLegacyRequestListQuery(proxyQuery);
  }

  if (
    isLegacyCustomerApiMode(event) &&
    method === 'GET' &&
    targetPathSegments[0] === 'order' &&
    targetPathSegments.length === 1
  ) {
    proxyQuery = toLegacyOrderListQuery(proxyQuery);
  }

  const targetUrl = buildTargetUrl(targetBaseUrl, targetPathSegments, proxyQuery);
  const isOrderInvoiceDownload =
    method === 'GET' &&
    targetPathSegments[0] === 'order' &&
    targetPathSegments.length === 3 &&
    targetPathSegments[2] === 'invoice';

  const execute = async () => {
    try {
      return await $fetch.raw(targetUrl, {
        method,
        headers,
        body: parsedBody ? JSON.stringify(parsedBody) : rawBody,
        ignoreResponseError: true,
        responseType: isOrderInvoiceDownload ? 'arrayBuffer' : undefined,
      });
    } catch (error) {
      return forwardApiError(
        event,
        {
          statusCode: 503,
          statusMessage: 'Service Unavailable',
          data: {
            message: 'The API is currently unavailable. Please restart the backend and try again.',
            error: 'Service Unavailable',
            statusCode: 503,
          },
          cause: error,
        },
        'The API is currently unavailable. Please restart the backend and try again.',
      );
    }
  };

  let response = await execute();
  if (!('status' in response)) {
    return response;
  }

  if (response.status === 401 && !hasExplicitAuthorization && refreshToken) {
    await refreshCustomerSession(event);
    const nextAccessToken = getAccessTokenCookie(event);

    if (nextAccessToken) {
      headers.set('authorization', `Bearer ${nextAccessToken}`);
      response = await execute();
      if (!('status' in response)) {
        return response;
      }
    }
  }

  setResponseStatus(event, response.status);

  if (response.status >= 400) {
    if (
      isLegacyCustomerApiMode(event) &&
      method === 'GET' &&
      targetPathSegments[0] === 'analytics' &&
      targetPathSegments[1] === 'total-procurement' &&
      (response.status === 404 || response.status === 500)
    ) {
      setResponseStatus(event, 200);
      return {
        status: true,
        message: 'No procurements for period',
        data: {
          totalAmountSpent: 0,
          procurementSummary: {},
          percentageChanges: {},
          previousTotalAmountSpent: 0,
        },
      };
    }

    if (
      isLegacyCustomerApiMode(event) &&
      method === 'GET' &&
      targetPathSegments[0] === 'analytics' &&
      targetPathSegments[1] === 'product-analysis' &&
      (response.status === 404 || response.status === 500)
    ) {
      setResponseStatus(event, 200);
      return {
        status: true,
        message: 'No product analysis for period',
        data: [],
      };
    }

    if (
      isLegacyCustomerApiMode(event) &&
      method === 'GET' &&
      targetPathSegments[0] === 'analytics' &&
      targetPathSegments[1] === 'top-procured-items' &&
      (response.status === 404 || response.status === 500)
    ) {
      setResponseStatus(event, 200);
      return {
        status: true,
        message: 'Items fetched successfully',
        data: [],
      };
    }

    const payload = response._data as Record<string, unknown> | string | null;
    return forwardApiError(
      event,
      {
        statusCode: response.status,
        statusMessage: response.statusText || 'Proxy request failed',
        data: payload,
      },
      'Proxy request failed',
    );
  }

  if (isLegacyCustomerApiMode(event)) {
    const legacyData = response._data;

    if (isOrderInvoiceDownload) {
      setResponseHeader(event, 'content-type', response.headers.get('content-type') ?? 'application/pdf');
      const disposition = response.headers.get('content-disposition');
      if (disposition) {
        setResponseHeader(event, 'content-disposition', disposition);
      }

      if (legacyData instanceof ArrayBuffer) {
        return Buffer.from(legacyData);
      }

      if (legacyData instanceof Uint8Array) {
        return Buffer.from(legacyData);
      }

      return legacyData;
    }

    if (targetPathSegments[0] === 'branch') {
      if (method === 'GET' && targetPathSegments.length === 1) {
        return normalizeLegacyBranchListResponse(
          legacyData,
          Number(query.page ?? 1),
          Number(query.limit ?? 10),
          typeof query.search === 'string' ? query.search : undefined,
        );
      }

      if (method === 'DELETE' && targetPathSegments[1]) {
        return normalizeLegacyBranchDeleteResponse(legacyData, targetPathSegments[1]);
      }

      return normalizeLegacyBranchResponse(
        legacyData,
        method === 'POST'
          ? 'Branch created successfully'
          : method === 'GET'
            ? 'Branch retrieved successfully'
            : 'Branch updated successfully',
      );
    }

    if (targetPathSegments[0] === 'category') {
      if (method === 'GET' && targetPathSegments.length === 1) {
        return normalizeLegacyMarketCategoriesResponse(legacyData);
      }

      if (method === 'GET' && targetPathSegments[1]) {
        return normalizeLegacyMarketCategoryResponse(legacyData);
      }
    }

    if (targetPathSegments[0] === 'promotion' && method === 'GET') {
      if (targetPathSegments.length === 1) {
        return normalizeLegacyMarketPromotionsResponse(legacyData);
      }
    }

    if (
      targetPathSegments[0] === 'product' &&
      method === 'GET' &&
      targetPathSegments[1] === 'recent-orders' &&
      targetPathSegments[2]
    ) {
      return normalizeLegacyMarketRecentOrdersResponse(legacyData);
    }

    if (targetPathSegments[0] === 'product') {
      if (method === 'GET' && targetPathSegments[1] && targetPathSegments[1] !== 'search' && targetPathSegments[1] !== 'feed' && targetPathSegments[1] !== 'recent-orders') {
        return normalizeLegacyMarketProductResponse(legacyData);
      }
    }

    if (targetPathSegments[0] === 'request') {
      if (method === 'POST' && targetPathSegments.length === 1) {
        try {
          return normalizeLegacyCreateRequestResponse(legacyData);
        } catch (normalizeError) {
          console.error('[proxy] Failed to normalize legacy create-request response', normalizeError);
          return legacyData;
        }
      }

      if (method === 'GET' && targetPathSegments.length === 1) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const search = typeof query.search === 'string' ? query.search : undefined;
        const status = typeof query.status === 'string' ? query.status : undefined;
        const branchId = typeof query.branchId === 'string' ? query.branchId : undefined;
        const amountFromRaw = query.amountFrom != null ? Number(query.amountFrom) : Number.NaN;
        const amountToRaw = query.amountTo != null ? Number(query.amountTo) : Number.NaN;
        const normalized = normalizeLegacyRequestListResponse(legacyData, page, limit, {
          search,
          status,
          branchId,
          amountFrom: Number.isFinite(amountFromRaw) ? amountFromRaw : undefined,
          amountTo: Number.isFinite(amountToRaw) ? amountToRaw : undefined,
        });
        return scopeRequestListForSnapshot(sessionSnapshot, normalized);
      }

      const isRequestByIdPath =
        targetPathSegments.length >= 2 &&
        targetPathSegments[1] &&
        targetPathSegments[1] !== 'update-product-quantity' &&
        targetPathSegments[1] !== 'add-product';

      const isApproveRequestPath =
        method === 'PATCH' &&
        targetPathSegments.length === 3 &&
        targetPathSegments[2] === 'approve';

      const isRequestMutationPath =
        (method === 'PATCH' && targetPathSegments[1] === 'update-product-quantity') ||
        (method === 'PATCH' &&
          targetPathSegments[1] === 'add-product' &&
          Boolean(targetPathSegments[2])) ||
        (method === 'DELETE' &&
          targetPathSegments.length >= 4 &&
          targetPathSegments[2] === 'product');

      if (isApproveRequestPath) {
        const normalized = normalizeLegacyApproveRequestResponse(legacyData);
        if (normalized.data) {
          assertMemberCanViewRequest(sessionSnapshot, normalized.data);
        }
        return normalized;
      }

      if (isRequestMutationPath || (isRequestByIdPath && (method === 'GET' || method === 'PATCH' || method === 'DELETE'))) {
        const normalized = normalizeLegacyRequestResponse(legacyData);
        if (normalized.data) {
          assertMemberCanViewRequest(sessionSnapshot, normalized.data);
        }
        return normalized;
      }
    }

    if (targetPathSegments[0] === 'shopping-list') {
      if (method === 'GET' && targetPathSegments[1] === 'branch' && targetPathSegments[2]) {
        return normalizeLegacyShoppingListListResponse(legacyData);
      }

      if (method === 'GET' && targetPathSegments.length === 2 && targetPathSegments[1]) {
        return normalizeLegacyShoppingListResponse(legacyData);
      }

      if (method === 'POST' && targetPathSegments.length === 1) {
        return normalizeLegacyShoppingListResponse(legacyData, 'Shopping list created successfully');
      }

      if (method === 'PATCH' && targetPathSegments.length === 2) {
        return normalizeLegacyShoppingListResponse(legacyData, 'Shopping list updated successfully');
      }

      if (
        method === 'POST' &&
        targetPathSegments.length === 3 &&
        targetPathSegments[2] === 'items'
      ) {
        return normalizeLegacyShoppingListResponse(
          legacyData,
          'Item added to shopping list successfully',
        );
      }

      if (
        method === 'PATCH' &&
        targetPathSegments.length === 4 &&
        targetPathSegments[2] === 'items'
      ) {
        return normalizeLegacyShoppingListResponse(
          legacyData,
          'Shopping list item updated successfully',
        );
      }

      if (
        method === 'POST' &&
        targetPathSegments.length === 3 &&
        targetPathSegments[2] === 'move-items'
      ) {
        return normalizeLegacyShoppingListMoveResponse(legacyData);
      }

      if (method === 'DELETE' && targetPathSegments.length === 2) {
        return normalizeLegacyShoppingListActionResponse(
          legacyData,
          'Shopping list deleted successfully',
        );
      }

      if (
        method === 'DELETE' &&
        targetPathSegments.length === 3 &&
        targetPathSegments[2] === 'items'
      ) {
        return normalizeLegacyShoppingListActionResponse(
          legacyData,
          'All items in shopping list deleted successfully',
        );
      }

      if (
        method === 'DELETE' &&
        targetPathSegments.length === 4 &&
        targetPathSegments[2] === 'items'
      ) {
        return normalizeLegacyShoppingListActionResponse(legacyData, 'Item deleted successfully');
      }
    }

    if (targetPathSegments[0] === 'cart') {
      if (method === 'GET') {
        return normalizeLegacyCartResponse(legacyData);
      }

      if (method === 'POST') {
        try {
          return normalizeLegacyCartMutationResponse(legacyData, 'Cart created successfully');
        } catch (normalizeError) {
          console.error('[proxy] Failed to normalize legacy cart mutation response', normalizeError);
          return legacyData;
        }
      }

      if (method === 'PATCH') {
        return normalizeLegacyCartMutationResponse(legacyData, 'Cart updated successfully');
      }

      if (method === 'DELETE') {
        return normalizeLegacyCartMutationResponse(legacyData, 'Cart deleted successfully');
      }
    }

    if (targetPathSegments[0] === 'order') {
      if (method === 'GET' && targetPathSegments.length === 1) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const search = typeof query.search === 'string' ? query.search : undefined;
        return normalizeLegacyOrderListResponse(legacyData, page, limit, search);
      }

      if (
        method === 'GET' &&
        targetPathSegments.length === 3 &&
        targetPathSegments[2] === 'timeline' &&
        targetPathSegments[1]
      ) {
        return normalizeLegacyOrderTimelineResponse(legacyData);
      }

      if (
        method === 'GET' &&
        targetPathSegments.length === 2 &&
        targetPathSegments[1] &&
        targetPathSegments[1] !== 'summary'
      ) {
        return normalizeLegacyOrderResponse(legacyData);
      }
    }

    if (targetPathSegments[0] === 'wallet') {
      if (method === 'GET' && targetPathSegments[1] === 'transactions') {
        return normalizeLegacyWalletTransactionsResponse(legacyData);
      }

      if (method === 'GET') {
        return normalizeLegacyWalletResponse(legacyData);
      }

      if (method === 'POST' && targetPathSegments[1] === 'verify-bvn') {
        return normalizeLegacyVerifyBvnResponse(legacyData);
      }

      if (method === 'POST' && targetPathSegments[1] === 'fund') {
        return normalizeLegacyWalletActionResponse(legacyData, 'Wallet funded successfully');
      }

      if (method === 'POST') {
        return normalizeLegacyWalletResponse(legacyData, 'Wallet created successfully');
      }
    }

    if (targetPathSegments[0] === 'employee') {
      if (method === 'GET' && targetPathSegments[1] === 'branch' && targetPathSegments[2]) {
        const canReadPendingInvites = sessionSnapshot?.user_type !== 'employee';
        let invitesPayload: unknown = { data: [] };

        if (canReadPendingInvites) {
          const invitesUrl = buildTargetUrl(
            targetBaseUrl,
            ['employee', 'branch-pending-invites', targetPathSegments[2]],
            {},
          );
          const invitesResponse = await $fetch.raw(invitesUrl, {
            method: 'GET',
            headers,
            ignoreResponseError: true,
          });

          if (invitesResponse.status < 400) {
            invitesPayload = invitesResponse._data;
          } else if (invitesResponse.status !== 401 && invitesResponse.status !== 403) {
            const payload = invitesResponse._data as Record<string, unknown> | string | null;
            return forwardApiError(
              event,
              {
                statusCode: invitesResponse.status,
                statusMessage: invitesResponse.statusText || 'Proxy request failed',
                data: payload,
              },
              'Proxy request failed',
            );
          }
        }

        return normalizeLegacyBranchMembersResponse(
          legacyData,
          invitesPayload,
          Number(query.page ?? 1),
          Number(query.limit ?? 10),
          typeof query.search === 'string' ? query.search : undefined,
        );
      }

      if (targetPathSegments[1] === 'invite') {
        if (method === 'GET' && targetPathSegments[2]) {
          return normalizeLegacyInvitationDetails(legacyData);
        }

        if (
          method === 'POST' &&
          (targetPathSegments.length === 2 ||
            targetPathSegments[3] === 'resend' ||
            targetPathSegments[3] === 'link')
        ) {
          return normalizeLegacyInviteResponse(legacyData, 'Employee invitation sent successfully');
        }

        if (method === 'DELETE' && targetPathSegments[2]) {
          return normalizeLegacyCancelInviteResponse(legacyData, targetPathSegments[2]);
        }
      }

      if (method === 'DELETE' && targetPathSegments[1]) {
        return normalizeLegacyEmployeeDeleteResponse(legacyData, targetPathSegments[1]);
      }

      if (method === 'GET' || method === 'PATCH') {
        return normalizeLegacyEmployeeResponse(
          legacyData,
          method === 'GET' ? 'Employee retrieved successfully' : 'Employee updated successfully',
        );
      }
    }
  }

  return response._data;
});
