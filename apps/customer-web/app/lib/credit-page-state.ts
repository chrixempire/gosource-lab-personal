import type { CustomerCreditAccount, CustomerCreditApplication } from '~/types/credit';

const REAPPLY_WAIT_MS = 60 * 24 * 60 * 60 * 1000;

export function findLastInitialApplication(applications: CustomerCreditApplication[]) {
  const initial = applications.filter((item) => item.applicationType === 'initial');
  if (initial.length === 0) {
    return null;
  }
  return initial[initial.length - 1] ?? null;
}

export function findLastIncreaseApplication(applications: CustomerCreditApplication[]) {
  const increases = applications.filter((item) => item.applicationType === 'increase');
  if (increases.length === 0) {
    return null;
  }
  return increases[increases.length - 1] ?? null;
}

export function shouldShowCreditGetStarted(
  applications: CustomerCreditApplication[],
  account: CustomerCreditAccount | null,
) {
  if (account) {
    return false;
  }

  if (applications.length === 0) {
    return true;
  }

  const lastInitial = findLastInitialApplication(applications);
  if (!lastInitial) {
    return true;
  }

  if (lastInitial.status === 'rejected') {
    const rejectedAt = new Date(lastInitial.createdAt).getTime();
    if (Number.isNaN(rejectedAt)) {
      return true;
    }
    return Date.now() - rejectedAt >= REAPPLY_WAIT_MS;
  }

  return false;
}

export function shouldShowCreditNotEligible(
  canBuyOnCredit: boolean | null | undefined,
  applications: CustomerCreditApplication[],
  account: CustomerCreditAccount | null,
) {
  if (canBuyOnCredit !== false) {
    return false;
  }

  return !account && applications.length === 0;
}
