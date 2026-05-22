export enum ORDER_STATUS {
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  PARTIALLY_DELIVERED = 'partially_delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
  COMPLETED = 'completed',
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  READY = 'ready',
}

export enum ORDER_PAYMENT_STATUS {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  PARTIAL = 'partial',
}
