export type AdminMessageType = 'alert' | 'email';
export type AdminMessageStatus =
  | 'pending'
  | 'active'
  | 'inactive'
  | 'sent'
  | 'failed';

export type AdminMessageRow = {
  id: string;
  message: string;
  subject?: string;
  type: AdminMessageType;
  status: AdminMessageStatus;
  theme?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  resendCount: number;
};

export type AdminMessageListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type CreateAdminEmailPayload = {
  type: 'email';
  subject: string;
  message: string;
  users: string[];
};

export type AdminAlertPayload = {
  type?: 'alert';
  message: string;
  startDate: string;
  endDate: string;
  theme: string;
};
