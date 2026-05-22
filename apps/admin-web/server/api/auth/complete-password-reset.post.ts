import { readBody } from 'h3';
import type { AdminPasswordResetCompletePayload } from '@gosource/api-client';
import { postAdminAuth } from '../../utils/admin-auth-proxy';

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminPasswordResetCompletePayload>(event);

  return await postAdminAuth(
    event,
    'complete-password-reset',
    body,
    'Unable to reset password right now',
  );
});
