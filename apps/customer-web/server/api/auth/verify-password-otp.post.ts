import { readBody } from 'h3';
import type { VerifyResetOtpPayload } from '@gosource/api-client';
import { forwardApiError } from '../../utils/forward-api-error';
import {
  getCustomerApiBaseUrl,
  isLegacyCustomerApiMode,
} from '../../utils/customer-api-mode';

export default defineEventHandler(async (event) => {
  const body = await readBody<VerifyResetOtpPayload>(event);
  const endpoint = `${getCustomerApiBaseUrl(event)}/auth/verify-password-otp`;
  const requestBody = isLegacyCustomerApiMode(event)
    ? {
        email: body.email,
        otp: body.token,
      }
    : body;

  try {
    return await $fetch<Record<string, unknown>>(endpoint, {
      method: 'POST',
      body: requestBody,
    });
  } catch (error) {
    return forwardApiError(event, error, 'Unable to verify reset code right now') as never;
  }
});
