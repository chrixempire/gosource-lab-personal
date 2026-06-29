import { createError, readBody } from 'h3';
import { getAccessTokenCookie } from '../utils/customer-auth-session';
import { getCustomerApiBaseUrl } from '../utils/customer-api-mode';

type ReviewBody = {
  orderId?: string;
  rating?: number;
  comment?: string;
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as ReviewBody;
  const orderId = String(body.orderId ?? '').trim();
  const rating = Number(body.rating);

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'orderId is required' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw createError({ statusCode: 400, statusMessage: 'rating must be 1–5' });
  }

  const accessToken = getAccessTokenCookie(event);
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const targetUrl: string = `${getCustomerApiBaseUrl(event)}/reviews`;

  return await $fetch<unknown>(targetUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: { orderId, rating, comment: body.comment },
  });
});
