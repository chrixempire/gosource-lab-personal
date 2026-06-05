import { formatCreditFromKobo, koboToNaira } from '~/lib/credit-money';
import type { CustomerCreditAccount } from '~/types/credit';

export type CheckoutCreditEligibility = {
  enabled: boolean;
  availableNaira: number;
  description: string;
};

export function resolveCheckoutCreditEligibility(options: {
  canBuyOnCredit: boolean | null | undefined;
  account: CustomerCreditAccount | null;
  orderTotalNaira: number;
}): CheckoutCreditEligibility {
  const availableNaira = koboToNaira(options.account?.availableKobo ?? 0);

  if (options.canBuyOnCredit === false) {
    return {
      enabled: false,
      availableNaira,
      description: 'Credit checkout is not enabled for your business. Contact support if you need access.',
    };
  }

  if (!options.account) {
    return {
      enabled: false,
      availableNaira: 0,
      description: 'Apply for credit on GoSource to pay for orders with your credit line.',
    };
  }

  if ((options.account.totalOverdueKobo ?? 0) > 0) {
    return {
      enabled: false,
      availableNaira,
      description: 'Clear overdue credit repayments before placing new orders on credit.',
    };
  }

  if (options.orderTotalNaira > availableNaira) {
    return {
      enabled: false,
      availableNaira,
      description: `This order exceeds your available credit (${formatCreditFromKobo(options.account.availableKobo)}).`,
    };
  }

  return {
    enabled: true,
    availableNaira,
    description: 'Pay using your approved GoSource credit line. A 4% service charge applies at checkout.',
  };
}
