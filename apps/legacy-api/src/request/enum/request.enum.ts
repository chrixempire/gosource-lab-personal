export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum PaymentMethod {
  CREDIT = 'Credit',
  PAYSTACK = 'Paystack',
  TRANSFER = 'Transfer',
  WALLET = 'Wallet',
}

export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  PARTIAL = 'partial',
}
