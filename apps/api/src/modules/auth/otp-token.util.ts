import { createHmac, timingSafeEqual } from 'node:crypto';

export function hashOtpToken(token: string, secret: string) {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function verifyOtpToken(token: string, tokenHash: string, secret: string) {
  const incomingHash = hashOtpToken(token, secret);
  const incomingBuffer = Buffer.from(incomingHash, 'hex');
  const storedBuffer = Buffer.from(tokenHash, 'hex');

  if (incomingBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(incomingBuffer, storedBuffer);
}
