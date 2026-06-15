import assert from 'node:assert/strict';
import test from 'node:test';
import {
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
