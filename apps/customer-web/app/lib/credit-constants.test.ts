import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canReapplyCreditRequest,
  creditRepaymentPaymentMethodLabel,
  creditRepaymentStatusLabel,
  creditRepaymentStatusVariant,
  creditRequestStatusLabel,
  creditRequestTypeLabel,
  creditWorkflowStatusLabel,
} from './credit-constants';

test('creditRequestTypeLabel matches gosource-web-app credit history', () => {
  assert.equal(creditRequestTypeLabel('initial'), 'New Request');
  assert.equal(creditRequestTypeLabel('topup'), 'Top Up');
});

test('creditRequestStatusLabel maps approved to Ongoing and completed to Repaid', () => {
  assert.equal(creditRequestStatusLabel('approved'), 'Ongoing');
  assert.equal(creditRequestStatusLabel('completed'), 'Repaid');
  assert.equal(creditRequestStatusLabel('pending'), 'Pending');
});

test('creditWorkflowStatusLabel keeps approved as Approved for non-history contexts', () => {
  assert.equal(creditWorkflowStatusLabel('approved'), 'Approved');
  assert.equal(creditWorkflowStatusLabel('completed'), 'Repaid');
});

test('canReapplyCreditRequest matches gosource-web-app actions', () => {
  assert.equal(canReapplyCreditRequest('rejected'), true);
  assert.equal(canReapplyCreditRequest('cancelled'), true);
  assert.equal(canReapplyCreditRequest('approved'), false);
});

test('creditRepaymentPaymentMethodLabel formats enum values', () => {
  assert.equal(creditRepaymentPaymentMethodLabel('BANK_TRANSFER'), 'BANK TRANSFER');
  assert.equal(creditRepaymentPaymentMethodLabel('CARD'), 'CARD');
});

test('creditRepaymentStatusLabel maps completed repayments', () => {
  assert.equal(creditRepaymentStatusLabel('COMPLETED'), 'Completed');
});

test('creditRepaymentStatusVariant maps completed repayments to success', () => {
  assert.equal(creditRepaymentStatusVariant('COMPLETED'), 'success');
  assert.equal(creditRepaymentStatusVariant('completed'), 'success');
  assert.equal(creditRepaymentStatusVariant('PENDING'), 'warning');
  assert.equal(creditRepaymentStatusVariant('FAILED'), 'negative');
});
