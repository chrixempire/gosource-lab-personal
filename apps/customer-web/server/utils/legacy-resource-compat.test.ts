import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  normalizeLegacyOrderListResponse,
  toLegacyRejectRequestBody,
} from './legacy-resource-compat';

describe('toLegacyRejectRequestBody', () => {
  test('passes through rejectionReasons unchanged', () => {
    assert.deepEqual(toLegacyRejectRequestBody({ rejectionReasons: 'Out of stock' }), {
      rejectionReasons: 'Out of stock',
    });
  });

  test('maps reason to rejectionReasons for legacy API', () => {
    assert.deepEqual(toLegacyRejectRequestBody({ reason: '  Duplicate order  ' }), {
      rejectionReasons: 'Duplicate order',
    });
  });

  test('returns body unchanged when reason is empty', () => {
    assert.deepEqual(toLegacyRejectRequestBody({ reason: '   ' }), { reason: '   ' });
  });
});

describe('normalizeLegacyOrderListResponse', () => {
  test('filters by the normalized total displayed in the orders table', () => {
    const payload = {
      status: true,
      data: [
        {
          _id: 'normalized-above-max',
          reference: 'ORDER-73K',
          totalPrice: 40_000,
          products: [
            {
              _id: 'line-73k',
              quantity: 1,
              totalPrice: 73_335,
              product: { _id: 'product-73k', name: 'Product 73K' },
            },
          ],
        },
        {
          _id: 'normalized-in-range',
          reference: 'ORDER-44K',
          totalPrice: 44_399,
          products: [
            {
              _id: 'line-44k',
              quantity: 1,
              totalPrice: 44_399,
              product: { _id: 'product-44k', name: 'Product 44K' },
            },
          ],
        },
      ],
      meta: { total: 2 },
    };

    const result = normalizeLegacyOrderListResponse(payload, 1, 10, undefined, {
      amountFrom: 10_000,
      amountTo: 50_000,
    });

    assert.deepEqual(result.data.map((order) => order.id), ['normalized-in-range']);
    assert.equal(result.meta.total, 1);
  });
});
