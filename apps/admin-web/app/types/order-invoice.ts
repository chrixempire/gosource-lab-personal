export type OrderInvoicePreview = {
  referenceLabel: string;
  orderDateLabel: string;
  businessName: string;
  branchName: string;
  customerName: string;
  deliveryAddress: string;
  orderIdLabel: string;
  itemCount: number;
  itemsOrderedLabel: string;
  paymentMethod: string;
  lineItems: {
    name: string;
    quantityLabel: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  serviceCharge: number;
  total: number;
};
