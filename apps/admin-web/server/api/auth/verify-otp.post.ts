import { readBody } from 'h3';
import type { AdminVerifyOtpPayload } from '@gosource/api-client';
import { postAdminAuth } from '../../utils/admin-auth-proxy';

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminVerifyOtpPayload>(event);

  return await postAdminAuth(event, 'verify-otp', body, 'Unable to verify reset code right now');
});
