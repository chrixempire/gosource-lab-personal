export type CreditRepaymentInvoiceLineItem = {
  dateLabel: string;
  amountLabel: string;
  methodLabel: string;
  referenceCode: string;
};

export type CreditRepaymentInvoicePreview = {
  businessName: string;
  referenceCode: string;
  dateIssuedLabel: string;
  amountPaidLabel: string;
  paymentMethodLabel: string;
  lineItems: CreditRepaymentInvoiceLineItem[];
  totalLabel: string;
};
