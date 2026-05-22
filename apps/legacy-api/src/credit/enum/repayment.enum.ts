export enum RepaymentFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

export enum RepaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  WALLET = 'WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  USSD = 'USSD',
  OTHER = 'OTHER',
}

export enum PaymentRefStatus {
  PENDING = 'PENDING',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
