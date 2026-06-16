export type ActivityLogAction =
  | 'CREATE'
  | 'VIEW'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
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
  initiatorType: string;
  module: string;
  action: string;
  ipAddress: string | null;
  createdAt: string;
  createdAtLabel: string;
  objectLink: string | null;
};
