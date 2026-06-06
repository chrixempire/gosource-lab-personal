import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCheckoutCreditEligibility } from './checkout-credit.ts';

const baseAccount = {
  id: 'acc1',
  limitKobo: 1_000_000,
  outstandingKobo: 0,
  spendableAmountKobo: 1_000_000,
  availableKobo: 500_000,
  totalPaymentsKobo: 0,
  totalOverdueKobo: 0,
  creditUtilization: 0,
  status: 'active',
};

test('resolveCheckoutCreditEligibility disables when canBuyOnCredit is false', () => {
  const result = resolveCheckoutCreditEligibility({
    canBuyOnCredit: false,
    account: baseAccount,
    orderTotalNaira: 1000,
  });

  assert.equal(result.enabled, false);
});

test('resolveCheckoutCreditEligibility enables when account covers order', () => {
  const result = resolveCheckoutCreditEligibility({
    canBuyOnCredit: true,
    account: baseAccount,
    orderTotalNaira: 4000,
  });

  assert.equal(result.enabled, true);
  assert.equal(result.availableNaira, 5000);
});

test('resolveCheckoutCreditEligibility disables when order exceeds available credit', () => {
  const result = resolveCheckoutCreditEligibility({
    canBuyOnCredit: true,
    account: baseAccount,
    orderTotalNaira: 6000,
  });

  assert.equal(result.enabled, false);
});

test('resolveCheckoutCreditEligibility disables when overdue balance exists', () => {
  const result = resolveCheckoutCreditEligibility({
    canBuyOnCredit: true,
    account: { ...baseAccount, totalOverdueKobo: 10_000 },
    orderTotalNaira: 1000,
  });

  assert.equal(result.enabled, false);
});
