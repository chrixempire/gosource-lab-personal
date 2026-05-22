import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, derivedKey] = storedHash.split(':');
  if (!salt || !derivedKey) {
    return false;
  }

  const passwordBuffer = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(derivedKey, 'hex');

  return (
    passwordBuffer.length === storedBuffer.length &&
    timingSafeEqual(passwordBuffer, storedBuffer)
  );
}
