import { readBody } from 'h3';
import type { CustomerSignupPayload } from '@gosource/api-client';
import { forwardApiError } from '../../utils/forward-api-error';
import { getCustomerApiBaseUrl, isLegacyCustomerApiMode } from '../../utils/customer-api-mode';

export default defineEventHandler(async (event) => {
  const body = await readBody<CustomerSignupPayload>(event);

  try {
    const result = await $fetch<Record<string, unknown>>(`${getCustomerApiBaseUrl(event)}/auth/signup`, {
      method: 'POST',
      body,
    });

    if (isLegacyCustomerApiMode(event)) {
      const data =
        typeof result.data === 'object' && result.data !== null
          ? (result.data as Record<string, unknown>)
          : {};

      const resume = data.resume === true;
      const legacyOnboardingStep =
        typeof data.onboardingStep === 'number' ? data.onboardingStep : 1;
      const verified = data.verified === true;

      const onboardingStep = resume
        ? verified
          ? 3
          : 2
        : legacyOnboardingStep + 1;

      return {
        message:
          typeof result.message === 'string' ? result.message : 'Registration successful',
        data: {
          email: typeof data.email === 'string' ? data.email : body.email,
          businessId:
            typeof data._id === 'string'
              ? data._id
              : typeof data.id === 'string'
                ? data.id
                : undefined,
          onboardingStep,
          status: typeof data.status === 'string' ? data.status : undefined,
          resume,
        },
      };
    }

    return result;
  } catch (error) {
    return forwardApiError(event, error, 'Unable to create your business account right now') as never;
  }
});
