import assert from 'node:assert/strict';
import test from 'node:test';
import { requestMatchesListFilters } from './request-list-filters.ts';

const pendingRequest = {
  status: 'pending' as const,
  branchId: 'branch-1',
  totalPrice: 10_000,
};

test('requestMatchesListFilters keeps pending rows when pending filter is active', () => {
  assert.equal(
    requestMatchesListFilters(pendingRequest, { amountMin: null, amountMax: null, status: ['pending'] }),
    true,
  );
});

test('requestMatchesListFilters drops rejected rows from a pending-only list', () => {
  assert.equal(
    requestMatchesListFilters(
      { ...pendingRequest, status: 'rejected' },
      { amountMin: null, amountMax: null, status: ['pending'] },
    ),
    false,
  );
});

test('requestMatchesListFilters respects branch and amount filters', () => {
  const filters = { amountMin: 5_000, amountMax: 15_000, status: [] as Array<'pending'> };

  assert.equal(requestMatchesListFilters(pendingRequest, filters, { branchId: 'branch-1' }), true);
  assert.equal(requestMatchesListFilters(pendingRequest, filters, { branchId: 'branch-2' }), false);
  assert.equal(
    requestMatchesListFilters({ ...pendingRequest, totalPrice: 1_000 }, filters),
    false,
  );
});
