import { setResponseStatus, createError, type H3Event } from 'h3';
import { extractApiErrorMessage } from '@gosource/api-client';

type ForwardedErrorPayload = {
  message: string;
  error: string;
  statusCode: number;
  details?: unknown;
};

function toObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function getNestedPayload(error: unknown): Record<string, unknown> | null {
  const candidate = toObject(error);
  if (!candidate) {
    return null;
  }

  const response = toObject(candidate.response);
  return (
    toObject(candidate.data) ??
    toObject(response?._data) ??
    response ??
    toObject(candidate.cause)
  );
}

export function forwardApiError(
  event: H3Event,
  error: unknown,
  fallbackMessage = 'An unexpected error occurred',
): ForwardedErrorPayload {
  const candidate = toObject(error);
  const payload = getNestedPayload(error);

  const statusCode =
    (typeof payload?.statusCode === 'number' && payload.statusCode) ||
    (typeof candidate?.statusCode === 'number' && candidate.statusCode) ||
    (typeof candidate?.status === 'number' && candidate.status) ||
    500;

  const errorLabel =
    (typeof payload?.error === 'string' && payload.error) ||
    (typeof candidate?.statusMessage === 'string' && candidate.statusMessage) ||
    'Error';

  const details =
    payload && 'details' in payload ? payload.details : candidate && 'details' in candidate ? candidate.details : undefined;

  const body: ForwardedErrorPayload = {
    message: extractApiErrorMessage(payload ?? error, fallbackMessage),
    error: errorLabel,
    statusCode,
  };

  if (details !== undefined) {
    body.details = details;
  }

  setResponseStatus(event, statusCode);

  return body;
}

export function throwForwardedApiError(
  event: H3Event,
  error: unknown,
  fallbackMessage = 'An unexpected error occurred',
): never {
  const body = forwardApiError(event, error, fallbackMessage);

  throw createError({
    statusCode: body.statusCode,
    statusMessage: body.message,
    message: body.message,
    data: body,
  });
}
