export interface IActivityLog {
  description: string;
  initiator: string | null;
  /** Human-readable name of the actor (e.g. "Jane Doe"), captured at log time. */
  initiatorName?: string | null;
  /** Role name of the actor (admin or business role), captured at log time. */
  initiatorRole?: string | null;
  objectId?: string | null;
  initiatorType: string;
  module?: string;
  action?: string;
  ipAddress?: string | null;
  metadata?: Record<string, any>;
}

export enum ACTIVITY_LOG_ACTION_TYPE {
  CREATE = 'CREATE',
  VIEW = 'VIEW',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  OTHERS = 'OTHERS',
}

export enum INITIATOR_TYPE {
  ADMIN = 'ADMIN',
  BUSINESS = 'BUSINESS',
}
