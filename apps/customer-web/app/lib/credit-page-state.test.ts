import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldShowCreditGetStarted,
  shouldShowCreditNotEligible,
} from './credit-page-state.ts';
import type { CustomerCreditApplication } from '~/types/credit';

const baseApplication: CustomerCreditApplication = {
  id: 'app1',
  createdAt: '2024-01-01T00:00:00.000Z',
  status: 'pending',
  applicationType: 'initial',
  requestedAmountKobo: 0,
  approvedAmountKobo: 0,
  rejectionReason: '',
};

test('shouldShowCreditGetStarted when there are no applications', () => {
  assert.equal(shouldShowCreditGetStarted([], null), true);
});

test('shouldShowCreditGetStarted is false when account exists', () => {
  assert.equal(
    shouldShowCreditGetStarted([baseApplication], {
      id: 'acc1',
      limitKobo: 100,
      outstandingKobo: 0,
      spendableAmountKobo: 100,
      availableKobo: 100,
      totalPaymentsKobo: 0,
      totalOverdueKobo: 0,
      creditUtilization: 0,
      status: 'active',
    }),
    false,
  );
});

test('shouldShowCreditNotEligible when credit is disabled and no history', () => {
  assert.equal(shouldShowCreditNotEligible(false, [], null), true);
  assert.equal(shouldShowCreditNotEligible(true, [], null), false);
});
