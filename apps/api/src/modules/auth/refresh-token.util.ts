import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';

export function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken() {
  const sessionId = randomUUID();
  const secret = randomBytes(32).toString('base64url');
  const token = `${sessionId}.${secret}`;

  return {
    sessionId,
    token,
    tokenHash: hashRefreshToken(token),
  };
}

export function generateRefreshTokenForSession(sessionId: string) {
  const secret = randomBytes(32).toString('base64url');
  const token = `${sessionId}.${secret}`;

  return {
    token,
    tokenHash: hashRefreshToken(token),
  };
}

export function parseRefreshToken(token: string) {
  const [sessionId, secret] = token.split('.');

  if (!sessionId || !secret) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  return {
    sessionId,
    secret,
  };
}

export function compareRefreshToken(token: string, tokenHash: string) {
  const incomingHash = hashRefreshToken(token);

  if (incomingHash.length !== tokenHash.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(incomingHash), Buffer.from(tokenHash));
}
