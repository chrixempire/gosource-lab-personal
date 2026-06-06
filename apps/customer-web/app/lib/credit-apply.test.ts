import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCreditApplicationFormData,
  validateCreditApplyStep,
  type CreditApplicationFormValues,
} from './credit-apply.ts';

const validValues: CreditApplicationFormValues = {
  cacRegistrationNumber: 'RC-123456',
  tin: 'TIN-1',
  bvn: '22345678901',
  revenueRange: '1000001-5000000',
  yearOfOperations: '3-5',
  identityType: 'national_id',
  bankStatement: new File(['bank'], 'bank.pdf', { type: 'application/pdf' }),
  identity: new File(['id'], 'id.pdf', { type: 'application/pdf' }),
};

test('validateCreditApplyStep requires CAC on step 1', () => {
  const errors = validateCreditApplyStep(1, { ...validValues, cacRegistrationNumber: '' });
  assert.equal(errors.cacRegistrationNumber, 'CAC registration number is required');
});

test('validateCreditApplyStep requires files on steps 2 and 3', () => {
  assert.ok(validateCreditApplyStep(2, { ...validValues, bankStatement: null }).bankStatement);
  assert.ok(validateCreditApplyStep(3, { ...validValues, identity: null }).identity);
});

test('buildCreditApplicationFormData maps identity label and trims fields', () => {
  const formData = buildCreditApplicationFormData(validValues);
  assert.equal(formData.get('cacRegistrationNumber'), 'RC-123456');
  assert.equal(formData.get('identityType'), 'National ID');
  assert.equal(formData.get('bvn'), '22345678901');
  assert.ok(formData.get('bankStatement') instanceof File);
});
