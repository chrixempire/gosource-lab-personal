import { createError, readBody } from 'h3';
import { getAccessTokenCookie, getCustomerSessionSnapshot } from '../../utils/customer-auth-session';
import { getCustomerApiBaseUrl, isLegacyCustomerApiMode } from '../../utils/customer-api-mode';

type DevConfirmBody = {
  paymentReference?: string;
  amount?: number;
};

/**
 * Simulates Paystack charge.success → wallet.confirmTransaction for local development.
 * Not available in production builds.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  if (!isLegacyCustomerApiMode(event)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dev wallet confirm is only supported in legacy API mode',
    });
  }

  const body = (await readBody(event)) as DevConfirmBody;
  const paymentReference = String(body.paymentReference ?? '').trim();
  const amount = Number(body.amount);

  if (!paymentReference) {
    throw createError({ statusCode: 400, statusMessage: 'paymentReference is required' });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'amount must be a positive number' });
  }

  const accessToken = getAccessTokenCookie(event);
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const snapshot = getCustomerSessionSnapshot(event);
  const businessId = snapshot?.data?.businessId?.trim();
  if (!businessId) {
    throw createError({ statusCode: 400, statusMessage: 'Business session is required' });
  }

  const targetUrl = `${getCustomerApiBaseUrl(event)}/wallet/confirm-transaction`;

  await $fetch(targetUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: {
      reference: paymentReference,
      businessId,
      amount,
    },
  });

  return {
    status: true,
    message: 'Wallet funding confirmed (development)',
  };
});
