import { createError, readBody } from 'h3';
import { getAccessTokenCookie } from '../utils/customer-auth-session';
import { getCustomerApiBaseUrl } from '../utils/customer-api-mode';

type FeedbackBody = {
  message?: string;
  category?: string;
  rating?: number;
  page?: string;
};

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as FeedbackBody;
  const message = String(body.message ?? '').trim();

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: 'Message is required' });
  }

  const accessToken = getAccessTokenCookie(event);
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const targetUrl: string = `${getCustomerApiBaseUrl(event)}/feedback`;

  return await $fetch<unknown>(targetUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: {
      message,
      category: body.category,
      rating: body.rating,
      page: body.page,
    },
  });
});
