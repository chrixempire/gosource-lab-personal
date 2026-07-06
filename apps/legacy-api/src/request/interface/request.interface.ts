export interface IApproveRequest {
  coupon?: string;
  paymentMethod: string;
  /** Confirmed Paystack reference; verified server-side to mark the order paid. */
  paystackReference?: string;
}
