import type { H3Event } from 'h3';
import { getAdminLegacyApiBaseUrl } from './admin-api-base';
import { forwardApiError } from './forward-api-error';

export async function postAdminAuth<T>(
  event: H3Event,
  path: string,
  body: unknown,
  fallbackMessage: string,
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    return (await $fetch<T>(`${baseUrl}/admin/auth/${path}`, {
      method: 'POST',
      body: body as Record<string, unknown>,
    })) as T;
  } catch (error) {
    return forwardApiError(event, error, fallbackMessage) as never;
  }
}

export async function patchAdminAuth<T>(
  event: H3Event,
  path: string,
  body: unknown,
  accessToken: string,
  fallbackMessage: string,
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    return (await $fetch<T>(`${baseUrl}/admin/auth/${path}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: body as Record<string, unknown>,
    })) as T;
  } catch (error) {
    return forwardApiError(event, error, fallbackMessage) as never;
  }
}
