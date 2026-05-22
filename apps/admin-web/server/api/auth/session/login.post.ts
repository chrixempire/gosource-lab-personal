import { createError, readBody } from 'h3';
import type { AdminLoginPayload } from '@gosource/api-client';
import {
  loginAdminOnLegacyApi,
  normalizeAdminSessionUser,
  setAdminAuthSession,
  toClientAdminSession,
} from '../../../utils/admin-auth-session';
import { forwardApiError } from '../../../utils/forward-api-error';

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminLoginPayload>(event);

  let result: Awaited<ReturnType<typeof loginAdminOnLegacyApi>>;
  try {
    result = await loginAdminOnLegacyApi(event, {
      email: body.email.trim().toLowerCase(),
      password: body.password,
    });
  } catch (error) {
    return forwardApiError(event, error, 'Unable to sign in right now') as never;
  }

  if (!result?.access_token || !result?.refresh_token || !result?.data?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'A complete admin session is required',
    });
  }

  const user = normalizeAdminSessionUser(result.data);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'A complete admin session is required',
    });
  }

  const session = toClientAdminSession({
    message: result.message,
    data: user,
  });

  setAdminAuthSession(
    event,
    {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    },
    session,
  );

  return session;
});
