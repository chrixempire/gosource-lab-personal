/// <reference types="jest" />
import type { NextFunction, Request, Response } from 'express';
import { SecurityMiddleware } from './security.middleware';

function createResponseMock() {
  return {
    locals: {},
    setHeader: jest.fn(),
    removeHeader: jest.fn(),
  } as unknown as Response;
}

function createRequestMock(
  overrides: Partial<Request> = {},
): Request {
  return {
    method: 'POST',
    path: '/v2/auth/login',
    headers: {
      'content-length': '0',
      'user-agent': 'jest',
    },
    body: {
      email: 'owner@gosource.test',
      password: 'secret',
    },
    query: {},
    params: {},
    connection: {
      remoteAddress: '127.0.0.1',
    },
    ...overrides,
  } as unknown as Request;
}

describe('SecurityMiddleware rate limiting', () => {
  it('returns a 429-style error after the configured auth limit', async () => {
    const middleware = new SecurityMiddleware();
    const response = createResponseMock();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const next = jest.fn() as unknown as NextFunction;
      await middleware.use(createRequestMock(), response, next);
      expect(next).toHaveBeenCalledWith();
    }

    const next = jest.fn() as unknown as NextFunction;
    await middleware.use(createRequestMock(), response, next);

    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
    const error = (next as unknown as jest.Mock).mock.calls[0]?.[0] as
      | { getStatus?: () => number }
      | undefined;
    expect(typeof error?.getStatus).toBe('function');
    expect(error?.getStatus?.()).toBe(429);
  });
});
