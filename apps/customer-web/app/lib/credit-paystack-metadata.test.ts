import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCreditPaystackMetadata } from './credit-paystack-metadata';

test('buildCreditPaystackMetadata includes inline and custom_fields creditAccountId', () => {
  const metadata = buildCreditPaystackMetadata('507f1f77bcf86cd799439011');

  assert.equal(metadata.creditAccountId, '507f1f77bcf86cd799439011');
  assert.equal(metadata.custom_fields[0]?.variable_name, 'creditAccountId');
  assert.equal(metadata.custom_fields[0]?.value, '507f1f77bcf86cd799439011');
});
