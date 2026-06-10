export const SESSION_REFRESH_PATH = '/api/auth/session/refresh';

export const SESSION_EXPIRED_MESSAGE =
  'Your session has expired. Please log in again.';

const AUTH_SKIP_PREFIXES = [
  SESSION_REFRESH_PATH,
  '/api/auth/session/me',
  '/api/auth/session/login',
  '/api/auth/session/logout',
  '/api/auth/signup',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/send-password-email',
  '/api/auth/verify-password-otp',
  '/api/auth/reset-password',
  '/api/auth/initiate-password-reset',
  '/api/auth/complete-password-reset',
  '/api/auth/complete-admin-signup',
  '/api/auth/resend-invite',
];

type MaybeStatusError = {
  status?: number;
  statusCode?: number;
  response?: { status?: number };
};

export function getFetchErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = error as MaybeStatusError;
  return Number(candidate.statusCode ?? candidate.status ?? candidate.response?.status ?? 0) || null;
}

export function getFetchRequestPath(request: string | Request) {
  const value = typeof request === 'string' ? request : request.url;

  if (value.startsWith('/')) {
    return value.split('?')[0] ?? value;
  }

  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

export function shouldAttemptSessionRefresh(path: string) {
  if (!path.startsWith('/api/')) {
    return false;
  }

  return !AUTH_SKIP_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Deduplicate concurrent refresh calls (e.g. many 401s at once). */
export function createSessionRefreshCoordinator(refresh: () => Promise<void>) {
  let inflight: Promise<void> | null = null;

  return () => {
    if (!inflight) {
      inflight = refresh().finally(() => {
        inflight = null;
      });
    }

    return inflight;
  };
}

type FetchOptions = {
  _authRetry?: boolean;
  [key: string]: unknown;
};

type OfetchLike = (<T>(request: string | Request, options?: FetchOptions) => Promise<T>) & {
  raw: typeof globalThis.fetch;
  create: (defaults: Record<string, unknown>) => OfetchLike;
  native: typeof globalThis.fetch;
};

type WrapFetchWithSessionRetryOptions = {
  refreshSession: () => Promise<void>;
  onSessionRefreshFailed?: () => void | Promise<void>;
  shouldRefresh?: (path: string) => boolean;
};

/**
 * Wrap Nuxt/ofetch so a 401 triggers session refresh once, then retries the request.
 */
export function wrapFetchWithSessionRetry<TFetch extends OfetchLike>(
  originalFetch: TFetch,
  options: WrapFetchWithSessionRetryOptions,
): TFetch {
  const shouldRefresh = options.shouldRefresh ?? shouldAttemptSessionRefresh;

  const fetchWithAuthRetry = Object.assign(
    async <T>(request: string | Request, fetchOptions?: FetchOptions): Promise<T> => {
      try {
        return await originalFetch<T>(request, fetchOptions);
      } catch (error) {
        const path = getFetchRequestPath(
          typeof request === 'string' ? request : request,
        );

        if (
          fetchOptions?._authRetry ||
          getFetchErrorStatus(error) !== 401 ||
          !shouldRefresh(path)
        ) {
          throw error;
        }

        try {
          await options.refreshSession();
        } catch {
          await options.onSessionRefreshFailed?.();
          throw error;
        }

        try {
          return await originalFetch<T>(request, { ...fetchOptions, _authRetry: true });
        } catch (retryError) {
          throw retryError;
        }
      }
    },
    originalFetch,
  ) as TFetch;

  return fetchWithAuthRetry;
}
