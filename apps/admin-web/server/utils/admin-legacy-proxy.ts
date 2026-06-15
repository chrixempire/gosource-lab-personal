import { createError, type H3Event } from 'h3';
import { getAdminLegacyApiBaseUrl } from './admin-api-base';

/** Host for supplier receipt emails (`https://{host}/v2/admin/purchase-order/.../send-invoice`). */
export function getLegacyReceiptEmailHost(event: H3Event) {
  const config = useRuntimeConfig(event);
  const override = String(config.purchaseOrderReceiptHost ?? '').trim();

  if (override) {
    return override.replace(/^https?:\/\//i, '').split('/')[0] ?? override;
  }

  return new URL(getAdminLegacyApiBaseUrl(event)).host;
}
import { forwardApiError } from './forward-api-error';
import { withAdminLegacyAuthRetry } from './admin-legacy-proxy-auth';

type LegacyQueryValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | undefined
  | null;

export async function fetchAdminLegacyApi<T>(
  event: H3Event,
  path: string,
  options?: {
    query?: Record<string, LegacyQueryValue>;
    fallbackMessage?: string;
  },
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);
  const query = Object.fromEntries(
    Object.entries(options?.query ?? {}).filter(([, value]) => {
      if (value === undefined || value === null || value === '') {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return true;
    }),
  ) as Record<string, string | number | boolean | string[] | number[]>;

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch(`${baseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        query,
      }) as Promise<T>,
    );
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: string }).code)
        : '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      throw createError({
        statusCode: 503,
        statusMessage:
          'Legacy API is not reachable. Start apps/legacy-api (pnpm dev) and confirm NUXT_PUBLIC_LEGACY_API_BASE_URL matches its PORT.',
      });
    }
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}

export async function patchAdminLegacyApi<T>(
  event: H3Event,
  path: string,
  body: Record<string, unknown>,
  options?: { fallbackMessage?: string },
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch(`${baseUrl}${path}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      }) as Promise<T>,
    );
  } catch (error) {
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}

export async function postAdminLegacyApi<T>(
  event: H3Event,
  path: string,
  body: Record<string, unknown>,
  options?: { fallbackMessage?: string; headers?: Record<string, string> },
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...options?.headers,
        },
        body,
      }) as Promise<T>,
    );
  } catch (error) {
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}

export async function patchAdminLegacyFormData<T>(
  event: H3Event,
  path: string,
  fields: Record<string, string | number | boolean | undefined | null>,
  options?: { fallbackMessage?: string },
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    formData.append(key, String(value));
  }

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch(`${baseUrl}${path}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }) as Promise<T>,
    );
  } catch (error) {
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}

export async function postAdminLegacyFormData<T>(
  event: H3Event,
  path: string,
  fields: Record<string, string | number | boolean | undefined | null>,
  options?: { fallbackMessage?: string },
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    formData.append(key, String(value));
  }

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }) as Promise<T>,
    );
  } catch (error) {
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}

export async function deleteAdminLegacyApi<T>(
  event: H3Event,
  path: string,
  body: Record<string, unknown>,
  options?: { fallbackMessage?: string },
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch(`${baseUrl}${path}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      }) as Promise<T>,
    );
  } catch (error) {
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}

export async function postAdminLegacyMultipart<T>(
  event: H3Event,
  path: string,
  formData: FormData,
  options?: { fallbackMessage?: string },
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }) as Promise<T>,
    );
  } catch (error) {
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}

export async function patchAdminLegacyMultipart<T>(
  event: H3Event,
  path: string,
  formData: FormData,
  options?: { fallbackMessage?: string },
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch(`${baseUrl}${path}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }) as Promise<T>,
    );
  } catch (error) {
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}

export async function putAdminLegacyMultipart<T>(
  event: H3Event,
  path: string,
  formData: FormData,
  options?: { fallbackMessage?: string },
): Promise<T> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch(`${baseUrl}${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }) as Promise<T>,
    );
  } catch (error) {
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}

export async function fetchAdminLegacyBinary(
  event: H3Event,
  path: string,
  options?: { fallbackMessage?: string },
): Promise<ArrayBuffer> {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    return await withAdminLegacyAuthRetry(event, (accessToken) =>
      $fetch<ArrayBuffer>(`${baseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: 'arrayBuffer',
      }),
    );
  } catch (error) {
    return forwardApiError(
      event,
      error,
      options?.fallbackMessage ?? 'Legacy admin request failed',
    ) as never;
  }
}
