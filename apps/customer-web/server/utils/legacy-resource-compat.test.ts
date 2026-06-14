import { describe, expect, test } from 'vitest';
import { toLegacyRejectRequestBody } from './legacy-resource-compat';

describe('toLegacyRejectRequestBody', () => {
  test('passes through rejectionReasons unchanged', () => {
    expect(toLegacyRejectRequestBody({ rejectionReasons: 'Out of stock' })).toEqual({
      rejectionReasons: 'Out of stock',
    });
  });

  test('maps reason to rejectionReasons for legacy API', () => {
    expect(toLegacyRejectRequestBody({ reason: '  Duplicate order  ' })).toEqual({
      rejectionReasons: 'Duplicate order',
    });
  });

  test('returns body unchanged when reason is empty', () => {
    expect(toLegacyRejectRequestBody({ reason: '   ' })).toEqual({ reason: '   ' });
  });
});
