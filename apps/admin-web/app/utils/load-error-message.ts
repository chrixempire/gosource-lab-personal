export type AdminLoadErrorPresentationOptions = {
  /** Shown when the record is missing or status is 404. */
  notFoundTitle?: string;
  /** Shown for load failures that are not 404 (e.g. network, 401, 500). */
  loadFailedTitle?: string;
  /** Used in copy for 404, e.g. "product" → "this product". */
  resourceLabel?: string;
  /** Default body copy when the error is technical or unknown. */
  fallbackMessage?: string;
};

const FETCH_ERROR_PATTERN =
  /^\[(GET|POST|PUT|PATCH|DELETE)\]\s+"([^"]+)":\s*(\d{3})\b/i;

function readStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const record = error as Record<string, unknown>;
  const candidates = [
    record.statusCode,
    record.status,
    (record.response as Record<string, unknown> | undefined)?.status,
    (record.data as Record<string, unknown> | undefined)?.statusCode,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 400 && parsed < 600) {
      return parsed;
    }
  }

  const message = typeof record.message === 'string' ? record.message : '';
  const match = message.match(FETCH_ERROR_PATTERN);
  if (match?.[3]) {
    return Number(match[3]);
  }

  return undefined;
}

function isTechnicalMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return true;
  }

  return (
    FETCH_ERROR_PATTERN.test(trimmed) ||
    trimmed.startsWith('[') ||
    /\/api\//i.test(trimmed) ||
    /fetch failed/i.test(trimmed) ||
    /network error/i.test(trimmed)
  );
}

export function resolveAdminLoadErrorStatus(error: unknown): number | undefined {
  return readStatusCode(error);
}

export function getAdminLoadErrorTitle(
  error: unknown,
  options: AdminLoadErrorPresentationOptions = {},
): string {
  const status = resolveAdminLoadErrorStatus(error);
  const notFoundTitle = options.notFoundTitle ?? 'Not found';
  const loadFailedTitle = options.loadFailedTitle ?? 'Unable to load';

  if (status === 401) {
    return 'Sign in required';
  }

  if (status === 403) {
    return 'Access denied';
  }

  if (status === 404) {
    return notFoundTitle;
  }

  if (status && status >= 500) {
    return 'Something went wrong';
  }

  return loadFailedTitle;
}

export function formatAdminLoadErrorMessage(
  error: unknown,
  options: AdminLoadErrorPresentationOptions = {},
): string {
  const fallback =
    options.fallbackMessage ??
    'Something went wrong while loading this content. Please try again in a moment.';

  if (!error) {
    return fallback;
  }

  const status = resolveAdminLoadErrorStatus(error);
  const resource = options.resourceLabel?.trim();

  if (status === 401) {
    return 'Your session may have expired. Sign in again, then retry.';
  }

  if (status === 403) {
    return 'You do not have permission to view this. Contact an administrator if you need access.';
  }

  if (status === 404) {
    return resource
      ? `We could not find this ${resource}. It may have been removed or the link is incorrect.`
      : 'We could not find what you were looking for. It may have been removed or the link is incorrect.';
  }

  if (status && status >= 500) {
    return 'Our servers had trouble loading this data. Please wait a moment and try again.';
  }

  if (status === 400 || status === 422) {
    return 'This request could not be completed. Refresh the page or go back and try again.';
  }

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  if (!raw.trim() || isTechnicalMessage(raw)) {
    return fallback;
  }

  return raw.trim();
}

export function getAdminLoadErrorPresentation(
  error: unknown,
  options: AdminLoadErrorPresentationOptions = {},
) {
  return {
    title: getAdminLoadErrorTitle(error, options),
    message: formatAdminLoadErrorMessage(error, options),
    status: resolveAdminLoadErrorStatus(error),
  };
}
