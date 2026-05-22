import { BadRequestException } from '@nestjs/common';

const REQUIRED_INVITE_PATH = '/auth/invite-user';

function getAllowedInviteOrigins(): string[] {
  const configured = process.env.FRONTEND_APP_ORIGINS?.trim();

  if (!configured) {
    return [];
  }

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function validateInviteCallbackUrl(callbackUrl: string) {
  if (!callbackUrl?.trim()) {
    throw new BadRequestException('Callback URL is required');
  }

  let parsed: URL;

  try {
    parsed = new URL(callbackUrl);
  } catch {
    throw new BadRequestException('Callback URL is invalid');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestException('Callback URL must use http or https');
  }

  const allowedOrigins = getAllowedInviteOrigins();
  if (allowedOrigins.length === 0) {
    throw new BadRequestException('Invite callback origins are not configured');
  }

  const normalizedOrigin = parsed.origin;
  if (!allowedOrigins.includes(normalizedOrigin)) {
    throw new BadRequestException('Callback URL origin is not allowed');
  }

  if (parsed.pathname !== REQUIRED_INVITE_PATH) {
    throw new BadRequestException('Callback URL path is not allowed');
  }

  if (parsed.search || parsed.hash) {
    throw new BadRequestException('Callback URL cannot include query params or fragments');
  }

  return `${normalizedOrigin}${REQUIRED_INVITE_PATH}`;
}
