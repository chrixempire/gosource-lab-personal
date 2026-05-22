import { readBody } from 'h3';
import type { AdminPasswordResetRequestPayload } from '@gosource/api-client';
import { postAdminAuth } from '../../utils/admin-auth-proxy';

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminPasswordResetRequestPayload>(event);

  return await postAdminAuth(
    event,
    'initiate-password-reset',
    body,
    'Unable to send password reset code right now',
  );
});
