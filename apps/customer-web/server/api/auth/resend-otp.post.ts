import { readBody } from 'h3';
import { forwardApiError } from '../../utils/forward-api-error';
import { getCustomerApiBaseUrl } from '../../utils/customer-api-mode';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string }>(event);
  const endpoint = `${getCustomerApiBaseUrl(event)}/auth/resend-otp`;

  try {
    return await $fetch<Record<string, unknown>>(endpoint, {
      method: 'POST',
      body,
    });
  } catch (error) {
    return forwardApiError(event, error, 'Unable to resend the verification code right now') as never;
  }
});
