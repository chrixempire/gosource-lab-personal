import type { ApiError } from './types';

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const next = firstString(item);
      if (next) {
        return next;
      }
    }
  }

  return undefined;
}

function isTransportErrorMessage(message: string) {
  return (
    /^\[(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\]/i.test(message) ||
    /^Request failed with status code \d+$/i.test(message)
  );
}

function readResponsePayload(value: Record<string, unknown>) {
  const response =
    typeof value.response === 'object' && value.response !== null
      ? (value.response as Record<string, unknown>)
      : null;

  if (!response) {
    return null;
  }

  const payload = response._data ?? response.data;
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : null;
}

function extractObjectMessage(
  value: Record<string, unknown>,
  depth: number,
): string | undefined {
  if (depth > 4) {
    return undefined;
  }

  /** Prefer JSON body from fetch/ofetch/h3 before generic wrapper `message` (e.g. "[PATCH] … 403"). */
  const payload = value.data ?? value._data;
  if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
    const fromPayload = extractObjectMessage(payload as Record<string, unknown>, depth + 1);
    if (fromPayload) {
      return fromPayload;
    }
    const flatPayload = firstString((payload as Record<string, unknown>).message);
    if (flatPayload) {
      return flatPayload;
    }
  }

  const responsePayload = readResponsePayload(value);
  if (responsePayload) {
    const fromResponse = extractObjectMessage(responsePayload, depth + 1);
    if (fromResponse) {
      return fromResponse;
    }
    const flatResponse = firstString(responsePayload.message);
    if (flatResponse) {
      return flatResponse;
    }
  }

  const directMessage = firstString(value.message);
  if (directMessage && !isTransportErrorMessage(directMessage)) {
    return directMessage;
  }

  const directStatusMessage = firstString(value.statusMessage);
  if (directStatusMessage && !isTransportErrorMessage(directStatusMessage)) {
    return directStatusMessage;
  }

  const detailsMessage = firstString(value.details);
  if (detailsMessage) {
    return detailsMessage;
  }

  const nestedCandidates = [value.response, value.cause];

  for (const candidate of nestedCandidates) {
    const next = extractApiErrorMessage(candidate, '', depth + 1);
    if (next) {
      return next;
    }
  }

  const fallbackError = firstString(value.error);
  if (fallbackError && fallbackError !== 'Error' && fallbackError !== 'Forbidden') {
    return fallbackError;
  }

  return undefined;
}

export function extractApiErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred',
  depth = 0,
): string {
  if (depth > 4) {
    return fallback;
  }

  const direct = firstString(error);
  if (direct) {
    return direct;
  }

  if (typeof error === 'object' && error !== null) {
    const objectMessage = extractObjectMessage(error as Record<string, unknown>, depth);
    if (objectMessage) {
      return objectMessage;
    }
  }

  return fallback;
}

export function extractApiResponseMessage(
  response: unknown,
  fallback = 'Request completed successfully',
): string {
  if (typeof response === 'object' && response !== null) {
    const candidate = response as Record<string, unknown>;
    const directMessage = firstString(candidate.message);
    if (directMessage) {
      return directMessage;
    }

    if (typeof candidate.data === 'object' && candidate.data !== null) {
      const nestedMessage = firstString((candidate.data as Record<string, unknown>).message);
      if (nestedMessage) {
        return nestedMessage;
      }
    }
  }

  return fallback;
}

export function normalizeApiError(error: unknown): ApiError {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      code?: unknown;
      message?: unknown;
      status?: unknown;
      details?: unknown;
    };

    return {
      code: typeof candidate.code === 'string' ? candidate.code : 'UNKNOWN_ERROR',
      message: extractApiErrorMessage(error),
      status: typeof candidate.status === 'number' ? candidate.status : 500,
      details: candidate.details,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    status: 500,
  };
}
