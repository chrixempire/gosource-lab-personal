import { readBody } from 'h3';
import type { VerifyOtpPayload } from '@gosource/api-client';
import { forwardApiError } from '../../utils/forward-api-error';
import { getCustomerApiBaseUrl } from '../../utils/customer-api-mode';

export default defineEventHandler(async (event) => {
  const body = await readBody<VerifyOtpPayload>(event);
  const endpoint = `${getCustomerApiBaseUrl(event)}/auth/verify-otp`;

  try {
    return await $fetch<Record<string, unknown>>(endpoint, {
      method: 'POST',
      body,
    });
  } catch (error) {
    return forwardApiError(event, error, 'Unable to verify the code right now') as never;
  }
});
