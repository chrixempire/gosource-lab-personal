import type { CustomerAuthResponse, CustomerMeResponse, SetupAccountPayload } from '@gosource/api-client';
import { createError, readBody } from 'h3';
import { setCustomerAuthCookies, toClientCustomerSession } from '../../../utils/customer-auth-session';
import { getCustomerApiBaseUrl, isLegacyCustomerApiMode } from '../../../utils/customer-api-mode';
import { forwardApiError } from '../../../utils/forward-api-error';
import { extractLegacyAccessToken, normalizeLegacyCustomerSession } from '../../../utils/legacy-customer-auth';

export default defineEventHandler(async (event): Promise<CustomerMeResponse> => {
  const body = await readBody<SetupAccountPayload>(event);

  let result: CustomerAuthResponse;
  try {
    result = await $fetch<CustomerAuthResponse>(`${getCustomerApiBaseUrl(event)}/auth/setup-account`, {
      method: isLegacyCustomerApiMode(event) ? 'PATCH' : 'PATCH',
      body,
    });
  } catch (error) {
    return forwardApiError(event, error, 'Unable to complete account setup right now') as never;
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

    setCustomerAuthCookies(
      event,
      {
        accessToken,
        refreshToken: accessToken,
      },
      legacySession,
    );

    return legacySession;
  }

  if (!result?.access_token || !result?.refresh_token || !result?.data) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unable to establish a session right now',
    });
  }

  setCustomerAuthCookies(event, {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
  }, toClientCustomerSession({
    message: result.message,
    data: result.data,
    user_type: result.user_type,
  }));

  return toClientCustomerSession({
    message: result.message,
    data: result.data,
    user_type: result.user_type,
  });
});
