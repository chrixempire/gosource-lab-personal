import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCreditAccount,
  parseCreditApplications,
  parseCreditRequestDetail,
  parseCreditRequests,
  parseUpcomingCreditPayment,
} from './credit-api.ts';

test('parseCreditApplications unwraps legacy envelope', () => {
  const result = parseCreditApplications({
    status: true,
    message: 'ok',
    data: {
      credits: [{ _id: 'abc', status: 'pending', applicationType: 'initial' }],
      meta: { page: 1, limit: 200, total: 1 },
    },
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.id, 'abc');
  assert.equal(result.items[0]?.status, 'pending');
  assert.equal(result.meta.total, 1);
});

test('parseCreditApplications normalizes application status casing', () => {
  const result = parseCreditApplications({
    data: {
      credits: [{ _id: 'abc', status: 'PENDING', applicationType: 'initial' }],
    },
  });

  assert.equal(result.items[0]?.status, 'pending');
});

test('parseCreditAccount returns null when account id is missing', () => {
  assert.equal(parseCreditAccount({ status: true, data: { limitKobo: 100 } }), null);
});

test('parseCreditAccount maps kobo fields', () => {
  const account = parseCreditAccount({
    data: { _id: 'acc1', limitKobo: 500000, outstandingKobo: 10000, availableKobo: 490000 },
  });

  assert.equal(account?.id, 'acc1');
  assert.equal(account?.limitKobo, 500000);
  assert.equal(account?.availableKobo, 490000);
});

test('parseCreditRequests maps request rows', () => {
  const result = parseCreditRequests({
    data: {
      requests: [{ _id: 'req1', requestType: 'topup', requestedAmountKobo: 25000 }],
      meta: { page: 1, limit: 10, total: 1 },
    },
  });

  assert.equal(result.items[0]?.requestType, 'topup');
  assert.equal(result.items[0]?.requestedAmountKobo, 25000);
});

test('parseCreditRequestDetail maps repayment summary and schedules', () => {
  const detail = parseCreditRequestDetail({
    data: {
      _id: '507f1f77bcf86cd799439011',
      status: 'approved',
      requestType: 'initial',
      requestedAmountKobo: 100000,
      approvedAmountKobo: 100000,
      totalInterestAmountKobo: 5000,
      totalRepaymentAmountKobo: 105000,
      repaymentFrequency: 'MONTHLY',
      repaymentDuration: 3,
      schedules: [
        {
          _id: 'sched1',
          installmentNumber: 1,
          principalAmountKobo: 30000,
          interestAmountKobo: 1000,
          remainingAmountKobo: 31000,
          status: 'PENDING',
          dueDate: '2026-07-01',
        },
      ],
    },
  });

  assert.equal(detail?.id, '507f1f77bcf86cd799439011');
  assert.equal(detail?.totalRepaymentAmountKobo, 105000);
  assert.equal(detail?.schedules[0]?.installmentNumber, 1);
  assert.equal(detail?.schedules[0]?.remainingAmountKobo, 31000);
});

test('parseUpcomingCreditPayment handles empty upcoming payload', () => {
  assert.equal(parseUpcomingCreditPayment({ data: null }), null);
});

test('parseUpcomingCreditPayment maps totals', () => {
  const upcoming = parseUpcomingCreditPayment({
    data: {
      totalNextPaymentKobo: 150000,
      nextUpcoming: {
        dueDate: '2026-06-01',
        principalAmountKobo: 100000,
        interestAmountKobo: 50000,
      },
      overdueSummary: { count: 2, totalOverdueKobo: 50000 },
    },
  });

  assert.equal(upcoming?.totalNextPaymentKobo, 150000);
  assert.equal(upcoming?.principalAmountKobo, 100000);
  assert.equal(upcoming?.interestAmountKobo, 50000);
  assert.equal(upcoming?.overdueCount, 2);
  assert.equal(upcoming?.totalOverdueKobo, 50000);
  assert.equal(upcoming?.nextDueDate, '2026-06-01');
});
