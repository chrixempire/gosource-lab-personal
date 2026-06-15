import { createError, readBody } from 'h3';
import { getAccessTokenCookie } from '../../utils/customer-auth-session';
import { getCustomerApiBaseUrl, isLegacyCustomerApiMode } from '../../utils/customer-api-mode';

type DevConfirmBody = {
  paymentReference?: string;
  amountNaira?: number;
  creditAccountId?: string;
};

/**
 * Simulates Paystack charge.success → credit repayment webhook for local development.
 * Not available in production builds.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  if (!isLegacyCustomerApiMode(event)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dev credit repayment confirm is only supported in legacy API mode',
    });
  }

  const body = (await readBody(event)) as DevConfirmBody;
  const paymentReference = String(body.paymentReference ?? '').trim();
  const amountNaira = Number(body.amountNaira);
  const creditAccountId = String(body.creditAccountId ?? '').trim();

  if (!paymentReference) {
    throw createError({ statusCode: 400, statusMessage: 'paymentReference is required' });
  }

  if (!creditAccountId) {
    throw createError({ statusCode: 400, statusMessage: 'creditAccountId is required' });
  }

  if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'amountNaira must be a positive number' });
  }

  const accessToken = getAccessTokenCookie(event);
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const targetUrl = `${getCustomerApiBaseUrl(event)}/credit/dev-confirm-card-repayment`;

  await $fetch(targetUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: {
      paymentReference,
      amountNaira,
      creditAccountId,
    },
  });

  return {
    status: true,
    message: 'Credit repayment confirmed (development)',
  };
});
