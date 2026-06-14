import type { CustomerAuthResponse, CustomerLoginPayload, CustomerMeResponse } from '@gosource/api-client';
import { createError, readBody } from 'h3';
import {
  attachBranchBootstrap,
  setCustomerAuthCookies,
  shouldForceBranchBootstrapOnLogin,
  toClientCustomerSession,
} from '../../../utils/customer-auth-session';
import { getCustomerApiBaseUrl, isLegacyCustomerApiMode } from '../../../utils/customer-api-mode';
import { forwardApiError } from '../../../utils/forward-api-error';
import { extractLegacyAccessToken, normalizeLegacyCustomerSession } from '../../../utils/legacy-customer-auth';

export default defineEventHandler(async (event): Promise<CustomerMeResponse> => {
  const body = await readBody<CustomerLoginPayload>(event);

  let result: CustomerAuthResponse;
  try {
    result = await $fetch<CustomerAuthResponse>(`${getCustomerApiBaseUrl(event)}/auth/login`, {
      method: 'POST',
      body,
    });
  } catch (error) {
    return forwardApiError(event, error, 'Unable to sign in right now') as never;
  }

  if (isLegacyCustomerApiMode(event)) {
    const legacyPayload = result as unknown as Record<string, unknown>;
    const legacySession = normalizeLegacyCustomerSession(legacyPayload);
    const accessToken = extractLegacyAccessToken(legacyPayload);

    if (!legacySession || !accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unable to establish a session right now',
      });
    }

    const hydratedSession = await attachBranchBootstrap(event, legacySession, accessToken);

    setCustomerAuthCookies(
      event,
      {
        accessToken,
        refreshToken: accessToken,
      },
      hydratedSession,
    );

    return hydratedSession;
  }

  if (!result?.access_token || !result?.refresh_token || !result?.data) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unable to establish a session right now',
    });
  }

  const nextSession = await attachBranchBootstrap(
    event,
    toClientCustomerSession({
      message: result.message,
      data: result.data,
      user_type: result.user_type,
    }),
    result.access_token,
    { force: shouldForceBranchBootstrapOnLogin(event) },
  );

  setCustomerAuthCookies(event, {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
  }, nextSession);

  return nextSession;
});
