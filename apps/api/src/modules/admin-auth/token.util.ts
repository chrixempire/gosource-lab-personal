import { createHmac } from 'node:crypto';

type TokenPayload = {
  sub: string;
  email: string;
  user_type?: string;
  role: string;
  businessId?: string;
  branchId?: string;
  exp: number;
};

function encode(data: string): string {
  return Buffer.from(data).toString('base64url');
}

export function signToken(
  payload: Omit<TokenPayload, 'exp'>,
  secret: string,
  expiresInSeconds = 60 * 60 * 12,
): string {
  const body: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encodedPayload = encode(JSON.stringify(body));
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}
