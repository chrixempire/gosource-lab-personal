/// <reference types="jest" />
import { createCorsOriginValidator } from './cors.utils';

describe('cors.utils', () => {
  it('allows configured origins', () => {
    const validator = createCorsOriginValidator(['http://127.0.0.1:3000']) as (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => void;
    const callback = jest.fn();

    validator('http://127.0.0.1:3000', callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('allows requests without an origin header', () => {
    const validator = createCorsOriginValidator(['http://127.0.0.1:3000']) as (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => void;
    const callback = jest.fn();

    validator(undefined, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('rejects unknown origins', () => {
    const validator = createCorsOriginValidator(['http://127.0.0.1:3000']) as (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => void;
    const callback = jest.fn();

    validator('https://evil.example', callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(callback.mock.calls[0]?.[1]).toBe(false);
  });
});
