import { formatCreditAmountForInvoice } from '~/lib/credit-money';
import { creditRepaymentPaymentMethodLabel } from '~/lib/credit-constants';
import { formatRequestDate } from '~/lib/request-details';
import type { CustomerCreditRepayment } from '~/types/credit';

/** Root element id for jsPDF capture — unique from order invoices (`invoice-temp`). */
export const CREDIT_REPAYMENT_INVOICE_ELEMENT_ID = 'credit-repayment-invoice-temp';

export type CreditRepaymentInvoicePreview = {
  businessName: string;
  referenceCode: string;
  dateIssuedLabel: string;
  amountPaidLabel: string;
  paymentMethodLabel: string;
  lineItems: Array<{
    dateLabel: string;
    amountLabel: string;
    methodLabel: string;
    referenceCode: string;
  }>;
  totalLabel: string;
};

export function buildCreditRepaymentInvoicePreview(
  row: CustomerCreditRepayment,
  businessName: string,
): CreditRepaymentInvoicePreview {
  const amountLabel = formatCreditAmountForInvoice(row.paymentAmountKobo);
  const dateIssuedLabel = formatRequestDate(row.createdAt);
  const paymentMethodLabel = creditRepaymentPaymentMethodLabel(row.paymentMethod);

  return {
    businessName: businessName || '—',
    referenceCode: row.referenceCode,
    dateIssuedLabel,
    amountPaidLabel: amountLabel,
    paymentMethodLabel,
    lineItems: [
      {
        dateLabel: dateIssuedLabel,
        amountLabel,
        methodLabel: paymentMethodLabel,
        referenceCode: row.referenceCode,
      },
    ],
    totalLabel: amountLabel,
  };
}

export function creditRepaymentInvoiceFileName(
  row: CustomerCreditRepayment,
  businessName: string,
) {
  const business = businessName.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'repayment';
  return `${business}-ref-${row.referenceCode}`;
}
