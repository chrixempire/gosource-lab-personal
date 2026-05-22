import { createError, getHeader, readBody } from 'h3';
import type { AdminCompleteSignupPayload } from '@gosource/api-client';
import { patchAdminAuth } from '../../utils/admin-auth-proxy';

type CompleteAdminSignupBody = AdminCompleteSignupPayload & {
  token?: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<CompleteAdminSignupBody>(event);
  const headerToken = getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '').trim();
  const accessToken = headerToken || body.token?.trim();

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invitation token is required',
    });
  }

  return await patchAdminAuth(
    event,
    'complete-admin-signup',
    { password: body.password },
    accessToken,
    'Unable to complete account setup right now',
  );
});
