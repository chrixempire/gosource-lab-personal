export enum CreditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DEFAULTED = 'defaulted',
}

export enum CreditTimelineStatusT {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DOC_ADDED = 'doc_added',
  PURCHASE = 'purchase',
}

export enum CreditApplicationTypeT {
  INITIAL = 'initial',
  INCREASE = 'increase',
}

export enum CreditAccountStatusT {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

export enum CreditRequestTypeT {
  INITIAL = 'initial',
  TOPUP = 'topup',
}
