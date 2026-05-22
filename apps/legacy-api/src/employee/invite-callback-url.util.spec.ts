/// <reference types="jest" />
import { BadRequestException } from '@nestjs/common';
import { validateInviteCallbackUrl } from './invite-callback-url.util';

describe('validateInviteCallbackUrl', () => {
  const originalOrigins = process.env.FRONTEND_APP_ORIGINS;

  beforeEach(() => {
    process.env.FRONTEND_APP_ORIGINS =
      'http://127.0.0.1:3000,https://gosource.example.com';
  });

  afterAll(() => {
    process.env.FRONTEND_APP_ORIGINS = originalOrigins;
  });

  it('accepts an allowed origin with the invite path', () => {
    expect(
      validateInviteCallbackUrl('http://127.0.0.1:3000/auth/invite-user'),
    ).toBe('http://127.0.0.1:3000/auth/invite-user');
  });

  it('rejects callback urls from unknown origins', () => {
    expect(() =>
      validateInviteCallbackUrl('https://evil.example/auth/invite-user'),
    ).toThrow(BadRequestException);
  });

  it('rejects callback urls with the wrong path', () => {
    expect(() =>
      validateInviteCallbackUrl('http://127.0.0.1:3000/auth/reset-password'),
    ).toThrow(BadRequestException);
  });

  it('rejects callback urls with query strings', () => {
    expect(() =>
      validateInviteCallbackUrl(
        'http://127.0.0.1:3000/auth/invite-user?token=bad',
      ),
    ).toThrow(BadRequestException);
  });
});
