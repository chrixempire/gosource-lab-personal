import { readBody } from 'h3';
import type { ResetPasswordPayload } from '@gosource/api-client';
import { forwardApiError } from '../../utils/forward-api-error';
import { getCustomerApiBaseUrl } from '../../utils/customer-api-mode';

export default defineEventHandler(async (event) => {
  const body = await readBody<ResetPasswordPayload>(event);
  const endpoint = `${getCustomerApiBaseUrl(event)}/auth/reset-password`;

  try {
    return await $fetch<Record<string, unknown>>(endpoint, {
      method: 'POST',
      body,
    });
  } catch (error) {
    return forwardApiError(event, error, 'Unable to reset password right now') as never;
  }
});
