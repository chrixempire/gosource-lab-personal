/** Who a notification is addressed to (mirrors the customer JWT `user_type`). */
export enum NOTIFICATION_RECIPIENT_TYPE {
  BUSINESS = 'BUSINESS',
  EMPLOYEE = 'EMPLOYEE',
}

/** The kind of event a notification represents (drives icon/label/link on the bell). */
export enum NOTIFICATION_TYPE {
  REQUEST_CREATED = 'request_created',
  REQUEST_APPROVED = 'request_approved',
  REQUEST_REJECTED = 'request_rejected',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  ORDER_PAYMENT_STATUS_CHANGED = 'order_payment_status_changed',
  CREDIT_APPLICATION_APPROVED = 'credit_application_approved',
  CREDIT_APPLICATION_REJECTED = 'credit_application_rejected',
}

/** Payload for creating a single notification. */
export interface CreateNotificationInput {
  /** Recipient user id (a BusinessCustomer _id for BUSINESS, an Employee _id for EMPLOYEE). */
  recipient: string;
  recipientType: NOTIFICATION_RECIPIENT_TYPE;
  /** Owning business (tenant) id — scopes queries and guards cross-tenant leakage. */
  businessId: string;
  type: NOTIFICATION_TYPE;
  title: string;
  message: string;
  /** In-app deep link the bell row navigates to (e.g. `/manage-requests/:id`). */
  link?: string;
  metadata?: Record<string, unknown>;
}

/** SSE frame pushed to a connected client when a notification lands. */
export interface NotificationStreamMessage {
  type: 'notification' | 'ping';
  notification?: Record<string, unknown>;
}
