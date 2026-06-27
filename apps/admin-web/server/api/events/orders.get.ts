import { createError, defineEventHandler, setResponseHeaders } from 'h3';
import { getAdminLegacyApiBaseUrl } from '~~/server/utils/admin-api-base';
import { resolveAdminAccessToken } from '~~/server/utils/admin-legacy-proxy-auth';

/**
 * Same-origin SSE proxy for admin order events. The browser connects here with
 * its admin session cookie; we exchange it for the legacy Bearer token and pipe
 * legacy-api's `/v2/admin/order-events` stream straight back. EventSource cannot
 * send Authorization headers, so proxying keeps auth server-side (no token in
 * the URL).
 */
export default defineEventHandler(async (event) => {
  const token = await resolveAdminAccessToken(event);
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  // Abort the upstream stream when the browser disconnects.
  const controller = new AbortController();
  event.node.req.on('close', () => controller.abort());

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/admin/order-events`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal: controller.signal,
    });
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to reach the order events stream',
    });
  }

  if (!upstream.ok || !upstream.body) {
    throw createError({
      statusCode: upstream.status || 502,
      statusMessage: 'Order events stream is unavailable',
    });
  }

  setResponseHeaders(event, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    // Disable proxy buffering (nginx) so events flush immediately.
    'x-accel-buffering': 'no',
  });

  return upstream.body;
});
