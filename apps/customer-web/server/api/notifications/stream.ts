import { createError, setResponseHeader } from 'h3';
import {
  getAccessTokenCookie,
  getRefreshTokenCookie,
  refreshCustomerSession,
} from '../../utils/customer-auth-session';
import {
  getCustomerApiBaseUrl,
  isLegacyCustomerApiMode,
} from '../../utils/customer-api-mode';

/**
 * Server-Sent Events passthrough for the notification bell.
 *
 * The generic `/api/proxy/**` route buffers responses (`$fetch.raw`) and can't
 * carry a long-lived stream, so the bell connects here instead. The browser
 * opens an `EventSource('/api/notifications/stream')` same-origin (cookies
 * only); this handler resolves the session, attaches the Bearer token, and
 * pipes the upstream `GET /notification/stream` byte stream straight through.
 */
export default defineEventHandler(async (event) => {
  let accessToken = getAccessTokenCookie(event);
  const refreshToken = getRefreshTokenCookie(event);

  if (!accessToken && refreshToken) {
    await refreshCustomerSession(event);
    accessToken = isLegacyCustomerApiMode(event)
      ? refreshToken
      : getAccessTokenCookie(event);
  }

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No active session was found',
    });
  }

  const baseUrl = getCustomerApiBaseUrl(event);
  const upstreamUrl = `${baseUrl.replace(/\/$/, '')}/notification/stream`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: 'text/event-stream',
      },
    });
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Notification stream is unavailable',
    });
  }

  if (!upstream.ok || !upstream.body) {
    throw createError({
      statusCode: upstream.status || 502,
      statusMessage: 'Notification stream is unavailable',
    });
  }

  setResponseHeader(event, 'content-type', 'text/event-stream');
  setResponseHeader(event, 'cache-control', 'no-cache, no-transform');
  setResponseHeader(event, 'connection', 'keep-alive');
  // Disable proxy/nginx buffering so events flush immediately.
  setResponseHeader(event, 'x-accel-buffering', 'no');

  // Close the upstream connection when the client disconnects.
  event.node.req.on('close', () => {
    try {
      void upstream.body?.cancel();
    } catch {
      // already closed
    }
  });

  return upstream.body;
});
