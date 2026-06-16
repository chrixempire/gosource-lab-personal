import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRANCH_BOOTSTRAP_STALE_MS,
  hasCachedBranchBootstrap,
  isBranchBootstrapStale,
} from './customer-auth-session.ts';
import {
  deserializeCustomerSessionSnapshot,
  serializeCustomerSessionSnapshot,
  type CustomerSessionState,
} from './customer-session-snapshot.ts';

test('hasCachedBranchBootstrap is true only when hasBranch is already known', () => {
  const session: CustomerSessionState = {
    message: 'Session restored',
    user_type: 'customer',
    data: {
      id: 'cust_123',
      businessId: 'biz_123',
      email: 'owner@gosource.test',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phoneNumber: '+2348000000000',
      role: 'super_admin',
      status: 'active',
    },
  };

  assert.equal(hasCachedBranchBootstrap(session), false);
  assert.equal(
    hasCachedBranchBootstrap({
      ...session,
      bootstrap: { hasBranch: true },
    }),
    true,
  );
  assert.equal(
    hasCachedBranchBootstrap({
      ...session,
      bootstrap: { hasBranch: false },
    }),
    true,
  );
});

test('isBranchBootstrapStale treats missing or old checkedAt as stale', () => {
  assert.equal(isBranchBootstrapStale(undefined), true);
  assert.equal(isBranchBootstrapStale(Number.NaN), true);
  assert.equal(isBranchBootstrapStale(Date.now()), false);
  assert.equal(
    isBranchBootstrapStale(Date.now() - BRANCH_BOOTSTRAP_STALE_MS - 1),
    true,
  );
});

test('customer session snapshots keep only the whitelisted fields and round-trip', () => {
  const session: CustomerSessionState = {
    message: 'Login successful',
    user_type: 'customer',
    data: {
      id: 'cust_123',
      businessId: 'biz_123',
      email: 'owner@gosource.test',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phoneNumber: '+2348000000000',
      role: 'super_admin',
      status: 'active',
      onboardingStep: 2,
    },
    bootstrap: {
      hasBranch: true,
    },
  };

  const snapshot = serializeCustomerSessionSnapshot(session);

  assert.deepEqual(snapshot, {
    user_type: 'customer',
    data: {
      id: 'cust_123',
      businessId: 'biz_123',
      email: 'owner@gosource.test',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phoneNumber: '+2348000000000',
      role: 'super_admin',
      status: 'active',
      onboardingStep: 2,
    },
    bootstrap: {
      hasBranch: true,
    },
  });

  assert.deepEqual(deserializeCustomerSessionSnapshot(snapshot), {
    ...session,
    message: 'Session restored',
  });
});

test('employee session snapshots preserve branch context and ignore unknown fields', () => {
  const restored = deserializeCustomerSessionSnapshot({
    user_type: 'employee',
    data: {
      id: 'emp_123',
      businessId: 'biz_123',
      branchId: 'branch_123',
      email: 'staff@gosource.test',
      firstName: 'Grace',
      lastName: 'Hopper',
      phoneNumber: '+2348111111111',
      position: 'Manager',
      role: 'manager',
      status: 'active',
      ignored: 'nope',
    },
    bootstrap: {
      hasBranch: true,
    },
  });

  assert.deepEqual(restored, {
    message: 'Session restored',
    user_type: 'employee',
    data: {
      id: 'emp_123',
      businessId: 'biz_123',
      branchId: 'branch_123',
      email: 'staff@gosource.test',
      firstName: 'Grace',
      lastName: 'Hopper',
      phoneNumber: '+2348111111111',
      position: 'Manager',
      role: 'manager',
      status: 'active',
    },
    bootstrap: {
      hasBranch: true,
    },
  });
});
