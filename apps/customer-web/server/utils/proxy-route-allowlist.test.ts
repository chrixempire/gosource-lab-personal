import test from 'node:test';
import assert from 'node:assert/strict';
import { getProxyRouteRule } from './proxy-route-allowlist.ts';

test('allows product and category market routes', () => {
  assert.ok(getProxyRouteRule('GET', ['category']));
  assert.ok(getProxyRouteRule('GET', ['category', 'cat_123']));
  assert.ok(getProxyRouteRule('GET', ['product', 'prod_123']));
});

test('allows invite routes that need explicit authorization', () => {
  const inviteRule = getProxyRouteRule('GET', ['employee', 'invite', 'invite_123']);
  const setupRule = getProxyRouteRule('POST', ['employee', 'setup-account']);

  assert.equal(inviteRule?.allowExplicitAuthorization, true);
  assert.equal(setupRule?.allowExplicitAuthorization, true);
});

test('allows wallet routes including verify-bvn', () => {
  assert.ok(getProxyRouteRule('GET', ['wallet']));
  assert.ok(getProxyRouteRule('POST', ['wallet']));
  assert.ok(getProxyRouteRule('POST', ['wallet', 'verify-bvn']));
  assert.ok(getProxyRouteRule('POST', ['wallet', 'fund']));
  assert.ok(getProxyRouteRule('GET', ['wallet', 'transactions']));
});

test('allows customer credit routes', () => {
  assert.ok(getProxyRouteRule('GET', ['credit']));
  assert.ok(getProxyRouteRule('POST', ['credit']));
  assert.ok(getProxyRouteRule('POST', ['credit', 'limit-increase']));
  assert.ok(getProxyRouteRule('GET', ['credit', 'requests']));
  assert.ok(getProxyRouteRule('POST', ['credit', 'requests']));
  assert.ok(getProxyRouteRule('GET', ['credit', 'requests', 'req_123']));
  assert.ok(getProxyRouteRule('GET', ['credit', 'repayment-history']));
  assert.ok(getProxyRouteRule('GET', ['credit', 'credit-account']));
  assert.ok(getProxyRouteRule('PATCH', ['credit', 'cancel-request', 'req_123']));
  assert.ok(getProxyRouteRule('POST', ['credit', 'payment']));
  assert.ok(getProxyRouteRule('GET', ['credit', 'upcoming-payment']));
  assert.ok(getProxyRouteRule('GET', ['credit', '507f1f77bcf86cd799439011']));
});

test('rejects routes outside the explicit allowlist', () => {
  assert.equal(getProxyRouteRule('GET', ['auth', 'login']), null);
  assert.equal(getProxyRouteRule('GET', ['employee', 'branch-pending-invites', 'abc']), null);
  assert.equal(getProxyRouteRule('POST', ['product', 'feed']), null);
  assert.equal(getProxyRouteRule('POST', ['wallet', 'confirm-transaction']), null);
  assert.equal(getProxyRouteRule('GET', ['admin', 'credit']), null);
});
