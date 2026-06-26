import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeManageRequestsListReturn } from './customer-list-return.ts';

describe('sanitizeManageRequestsListReturn', () => {
  it('returns the index path with query intact', () => {
    assert.equal(
      sanitizeManageRequestsListReturn('/manage-requests?branchId=abc&page=2'),
      '/manage-requests?branchId=abc&page=2',
    );
  });

  it('falls back to the bare index for detail routes', () => {
    assert.equal(
      sanitizeManageRequestsListReturn('/manage-requests/req-1'),
      '/manage-requests',
    );
  });

  it('falls back for external or empty paths', () => {
    assert.equal(
      sanitizeManageRequestsListReturn('https://evil.example/phish'),
      '/manage-requests',
    );
    assert.equal(sanitizeManageRequestsListReturn(''), '/manage-requests');
  });
});
