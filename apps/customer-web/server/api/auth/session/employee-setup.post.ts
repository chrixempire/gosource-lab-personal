import type {
  CustomerAuthResponse,
  CustomerMeResponse,
  SetupEmployeeAccountPayload,
} from '@gosource/api-client';
import { createError, getRequestHeader, readBody } from 'h3';
import {
  clearCustomerAuthCookies,
  toClientCustomerSession,
} from '../../../utils/customer-auth-session';
import {
  getCustomerApiBaseUrl,
  isLegacyCustomerApiMode,
} from '../../../utils/customer-api-mode';
import { normalizeLegacyCustomerSession } from '../../../utils/legacy-customer-auth';
import { forwardApiError } from '../../../utils/forward-api-error';

export default defineEventHandler(async (event): Promise<CustomerMeResponse> => {
  const body = await readBody<SetupEmployeeAccountPayload>(event);
  const authorization = getRequestHeader(event, 'authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invitation token is required',
    });
  }

  let result: CustomerAuthResponse;
  try {
    result = await $fetch<CustomerAuthResponse>(`${getCustomerApiBaseUrl(event)}/employee/setup-account`, {
      method: 'POST',
      body,
      headers: {
        Authorization: authorization,
      },
    });
  } catch (error) {
    return forwardApiError(event, error, 'Unable to complete employee setup right now') as never;
  }

  if (isLegacyCustomerApiMode(event)) {
    const legacySession = normalizeLegacyCustomerSession(result as unknown as Record<string, unknown>);

    if (!legacySession) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unable to complete employee setup right now',
      });
    }

    clearCustomerAuthCookies(event);

    return legacySession;
  }

  if (!result?.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unable to complete employee setup right now',
    });
  }

  clearCustomerAuthCookies(event);

  return toClientCustomerSession({
    message: result.message,
    data: result.data,
    user_type: result.user_type ?? 'employee',
  });
});
