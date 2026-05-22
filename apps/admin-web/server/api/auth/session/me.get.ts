import { createError } from 'h3';
import {
  fetchAdminProfile,
  getAccessTokenCookie,
  getAdminSessionSnapshot,
  setAdminSessionSnapshot,
  toClientAdminSession,
} from '../../../utils/admin-auth-session';
import { forwardApiError } from '../../../utils/forward-api-error';

export default defineEventHandler(async (event) => {
  const accessToken = getAccessTokenCookie(event);

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No admin session was found',
    });
  }

  try {
    const snapshot = getAdminSessionSnapshot(event);
    const session = await fetchAdminProfile(event, accessToken, { mergeWith: snapshot });
    setAdminSessionSnapshot(event, session);
    return toClientAdminSession(session);
  } catch (error) {
    const snapshot = getAdminSessionSnapshot(event);
    if (snapshot) {
      return toClientAdminSession(snapshot);
    }

    return forwardApiError(event, error, 'Unable to restore admin session') as never;
  }
});
