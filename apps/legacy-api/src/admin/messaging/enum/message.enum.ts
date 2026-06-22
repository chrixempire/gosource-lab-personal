export enum AdminMessageType {
  ALERT = 'alert',
  EMAIL = 'email',
}

export enum AdminMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum AdminMessageAudience {
  ALL = 'all',
  SELECTED = 'selected',
}
