import { createHmac, timingSafeEqual } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  user_type: string;
  role: string;
  businessId?: string;
  branchId?: string;
  exp: number;
};

function decode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}

export function verifyToken(token: string, secret: string): AuthTokenPayload {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    throw new UnauthorizedException('Invalid authentication token');
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new UnauthorizedException('Invalid authentication token');
  }

  let payload: AuthTokenPayload;
  try {
    payload = JSON.parse(decode(encodedPayload)) as AuthTokenPayload;
  } catch {
    throw new UnauthorizedException('Invalid authentication token');
  }

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedException('Authentication token has expired');
  }

  return payload;
}
