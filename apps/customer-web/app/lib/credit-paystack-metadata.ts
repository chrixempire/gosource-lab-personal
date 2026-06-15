/** Paystack metadata for credit card repayments (inline + verify/webhook). */
export function buildCreditPaystackMetadata(creditAccountId: string) {
  const id = String(creditAccountId).trim();

  return {
    creditAccountId: id,
    custom_fields: [
      {
        display_name: 'Credit account',
        variable_name: 'creditAccountId',
        value: id,
      },
    ],
  };
}
