import { createError, type H3Event } from 'h3';

/**
 * legacy-api enables URI versioning with default version `2` (see legacy-api main.ts).
 * Admin routes are served under `/v2/admin/...`, matching customer-web legacy mode.
 */
export function getAdminLegacyApiBaseUrl(event: H3Event) {
  const config = useRuntimeConfig(event);
  const raw = String(config.public.legacyApiBaseUrl || '').replace(/\/$/, '');

  if (!raw) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Legacy API base URL is not configured',
    });
  }

  return raw.endsWith('/v2') ? raw : `${raw}/v2`;
}
