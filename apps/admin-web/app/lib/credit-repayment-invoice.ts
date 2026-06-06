/** Matches reference `RepaymentInvoice` root id for PDF capture. */
export const CREDIT_REPAYMENT_INVOICE_ELEMENT_ID = 'invoice-temp';

import { formatCreditFromKobo } from '~/lib/credit-money';
import type { AdminRepaymentListItem } from '~/types/credit';
import type { CreditRepaymentInvoicePreview } from '~/types/credit-repayment-invoice';

export function buildCreditRepaymentInvoicePreview(
  row: AdminRepaymentListItem,
): CreditRepaymentInvoicePreview {
  const amountLabel = formatCreditFromKobo(row.amountKobo);
  return {
    businessName: row.businessName,
    referenceCode: row.referenceCode,
    dateIssuedLabel: row.paymentDateLabel,
    amountPaidLabel: amountLabel,
    paymentMethodLabel: row.paymentMethodLabel,
    lineItems: [
      {
        dateLabel: row.paymentDateLabel,
        amountLabel,
        methodLabel: row.paymentMethodLabel,
        referenceCode: row.referenceCode,
      },
    ],
    totalLabel: amountLabel,
  };
}

export function creditRepaymentInvoiceFileName(row: AdminRepaymentListItem) {
  const business = row.businessName.replace(/[^a-zA-Z0-9_-]+/g, '_');
  return `${business}-ref-${row.referenceCode}`;
}
