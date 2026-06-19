import { describe, expect, it } from 'vitest';
import { sanitizeManageRequestsListReturn } from './customer-list-return.ts';

describe('sanitizeManageRequestsListReturn', () => {
  it('returns the index path with query intact', () => {
    expect(sanitizeManageRequestsListReturn('/manage-requests?branchId=abc&page=2')).toBe(
      '/manage-requests?branchId=abc&page=2',
    );
  });

  it('falls back to the bare index for detail routes', () => {
    expect(sanitizeManageRequestsListReturn('/manage-requests/req-1')).toBe('/manage-requests');
  });

  it('falls back for external or empty paths', () => {
    expect(sanitizeManageRequestsListReturn('https://evil.example/phish')).toBe('/manage-requests');
    expect(sanitizeManageRequestsListReturn('')).toBe('/manage-requests');
  });
});
