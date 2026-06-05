import { koboToNaira } from '~/lib/credit-money';
import { parseNairaAmountInput } from '~/lib/wallet-display';
import type { CreditRequestType } from '~/types/credit';

export type CreditGetCreditFormValues = {
  requestedAmount: string;
  repaymentFrequency: string;
  repaymentDuration: string;
};

export function createEmptyCreditGetCreditForm(): CreditGetCreditFormValues {
  return {
    requestedAmount: '',
    repaymentFrequency: '',
    repaymentDuration: '',
  };
}

export function validateCreditGetCreditForm(
  values: CreditGetCreditFormValues,
  options: { availableKobo: number; requestType: CreditRequestType },
) {
  const errors: Partial<Record<keyof CreditGetCreditFormValues, string>> = {};
  const amountNaira = parseNairaAmountInput(values.requestedAmount);

  if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
    errors.requestedAmount = 'Enter a valid credit amount';
  } else if (amountNaira > koboToNaira(options.availableKobo)) {
    errors.requestedAmount = 'Amount exceeds your available credit';
  }

  if (!values.repaymentFrequency) {
    errors.repaymentFrequency = 'Repayment frequency is required';
  }

  if (!values.repaymentDuration) {
    errors.repaymentDuration = 'Repayment duration is required';
  }

  return errors;
}

export function buildCreateCreditRequestPayload(
  values: CreditGetCreditFormValues,
  requestType: CreditRequestType,
) {
  return {
    requestedAmount: parseNairaAmountInput(values.requestedAmount),
    requestType,
    requestedRepaymentFrequency: values.repaymentFrequency,
    requestedRepaymentDuration: Number(values.repaymentDuration),
  };
}
