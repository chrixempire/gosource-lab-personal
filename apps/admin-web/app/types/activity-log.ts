export type ActivityLogAction =
  | 'CREATE'
  | 'VIEW'
  | 'UPDATE'
  | 'DELETE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'OTHERS';

export type ActivityLogInitiatorType = 'ADMIN' | 'BUSINESS';

export type ActivityLogListFilters = {
  search: string;
  module: string;
  action: ActivityLogAction | '';
  initiatorType: ActivityLogInitiatorType | '';
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
};

export type AdminActivityLogItem = {
  id: string;
  description: string;
  objectId: string | null;
  initiator: string | null;
  /** Readable actor name (populated admin, or the snapshot captured at log time). */
  initiatorName: string | null;
  /** Actor email when the admin is resolvable. */
  initiatorEmail: string | null;
  /** Actor role name when the admin is resolvable. */
  initiatorRole: string | null;
  initiatorType: string;
  module: string;
  action: string;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  createdAtLabel: string;
  objectLink: string | null;
};
