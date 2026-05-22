import { createError } from 'h3';
import {
  fetchAdminProfile,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  getAdminSessionSnapshot,
  refreshAdminSession,
  setAdminSessionSnapshot,
  toClientAdminSession,
} from '../../../utils/admin-auth-session';
import { forwardApiError } from '../../../utils/forward-api-error';

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

  if (!accessToken && !refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No admin session was found',
    });
  }

  if (!accessToken && refreshToken) {
    return toClientAdminSession(await refreshAdminSession(event));
  }

  try {
    const snapshot = getAdminSessionSnapshot(event);
    const session = await fetchAdminProfile(event, accessToken!, { mergeWith: snapshot });
    setAdminSessionSnapshot(event, session);
    return toClientAdminSession(session);
  } catch (error) {
    if (refreshToken && isUnauthorized(error)) {
      try {
        return toClientAdminSession(await refreshAdminSession(event));
      } catch {
        /* fall through */
      }
    }

    const snapshot = getAdminSessionSnapshot(event);
    if (snapshot) {
      return toClientAdminSession(snapshot);
    }

    return forwardApiError(event, error, 'Unable to restore admin session') as never;
  }
});
