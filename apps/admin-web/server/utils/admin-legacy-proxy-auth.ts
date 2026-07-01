import { createError, type H3Event } from 'h3';
import {
  clearAdminAuthCookies,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  refreshAdminSessionWithToken,
} from './admin-auth-session';

function isUnauthorizedApiError(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
  };

  const status =
    candidate.statusCode ??
    candidate.status ??
    candidate.response?.status;

  return Number(status) === 401;
}

export async function resolveAdminAccessToken(event: H3Event) {
  let accessToken = getAccessTokenCookie(event);
  const refreshToken = getRefreshTokenCookie(event);

  if (!accessToken && refreshToken) {
    // Use the token returned by the refresh — re-reading the cookie here would
    // return the stale request value (setCookie only updates the response).
    ({ accessToken } = await refreshAdminSessionWithToken(event));
  }

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No admin session was found',
    });
  }

  return accessToken;
}

export async function withAdminLegacyAuthRetry<T>(
  event: H3Event,
  request: (accessToken: string) => Promise<T>,
): Promise<T> {
  let accessToken = await resolveAdminAccessToken(event);

  try {
    return await request(accessToken);
  } catch (error) {
    if (!isUnauthorizedApiError(error) || !getRefreshTokenCookie(event)) {
      throw error;
    }

    try {
      // Use the freshly returned token, not a re-read of the request cookie
      // (which still holds the old, expired token within this request).
      const refreshed = await refreshAdminSessionWithToken(event);
      accessToken = refreshed.accessToken;

      if (!accessToken) {
        throw error;
      }

      return await request(accessToken);
    } catch (refreshError) {
      clearAdminAuthCookies(event);
      throw refreshError;
    }
  }
}
