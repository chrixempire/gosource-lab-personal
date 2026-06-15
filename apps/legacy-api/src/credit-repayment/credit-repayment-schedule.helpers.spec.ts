import { RepaymentStatus } from '../credit/enum/repayment.enum';
import {
  getSchedulePrincipalRemainingKobo,
  sumPrincipalRemainingKobo,
} from './credit-repayment-schedule.helpers';

describe('credit repayment schedule helpers', () => {
  it('returns full principal for an unpaid schedule', () => {
    expect(
      getSchedulePrincipalRemainingKobo({
        status: RepaymentStatus.PENDING,
        paidAmountKobo: 0,
        principalAmountKobo: 16_666_67,
        interestAmountKobo: 5_000_00,
      }),
    ).toBe(16_666_67);
  });

  it('allocates paid amount to interest before principal', () => {
    expect(
      getSchedulePrincipalRemainingKobo({
        status: RepaymentStatus.PARTIALLY_PAID,
        paidAmountKobo: 5_000_00,
        principalAmountKobo: 16_666_67,
        interestAmountKobo: 5_000_00,
      }),
    ).toBe(16_666_67);

    expect(
      getSchedulePrincipalRemainingKobo({
        status: RepaymentStatus.PARTIALLY_PAID,
        paidAmountKobo: 21_666_67,
        principalAmountKobo: 16_666_67,
        interestAmountKobo: 5_000_00,
      }),
    ).toBe(0);
  });

  it('sums principal remaining across unpaid schedules', () => {
    expect(
      sumPrincipalRemainingKobo([
        {
          status: RepaymentStatus.PAID,
          paidAmountKobo: 21_666_67,
          principalAmountKobo: 16_666_67,
          interestAmountKobo: 5_000_00,
        },
        {
          status: RepaymentStatus.PENDING,
          paidAmountKobo: 0,
          principalAmountKobo: 16_666_67,
          interestAmountKobo: 5_000_00,
        },
      ]),
    ).toBe(16_666_67);
  });
});
