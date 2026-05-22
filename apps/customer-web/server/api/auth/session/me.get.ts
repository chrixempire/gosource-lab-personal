import { createError } from 'h3';
import {
  fetchCustomerMe,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  getCustomerSessionSnapshot,
  refreshCustomerSession,
  setCustomerAuthCookies,
} from '../../../utils/customer-auth-session';

function isUnauthorized(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error || 'statusCode' in error) &&
    (Number((error as { status?: number; statusCode?: number }).status) === 401 ||
      Number((error as { status?: number; statusCode?: number }).statusCode) === 401)
  );
}

export default defineEventHandler(async (event) => {
  const accessToken = getAccessTokenCookie(event);
  const refreshToken = getRefreshTokenCookie(event);
  const sessionSnapshot = getCustomerSessionSnapshot(event);

  if (!accessToken && !refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No customer session was found',
    });
  }

  if (!accessToken && refreshToken) {
    return await refreshCustomerSession(event);
  }

  try {
    const me = await fetchCustomerMe(event, accessToken!);

    if (!me.data) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No active session was found',
      });
    }

    const nextSession = me;

    if (sessionSnapshot && accessToken) {
      setCustomerAuthCookies(
        event,
        {
          accessToken,
          refreshToken: refreshToken ?? accessToken,
        },
        nextSession,
      );
    }

    return nextSession;
  } catch (error) {
    if (refreshToken && isUnauthorized(error)) {
      return await refreshCustomerSession(event);
    }

    throw error;
  }
});
