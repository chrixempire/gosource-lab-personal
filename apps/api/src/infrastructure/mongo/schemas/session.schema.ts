export const CUSTOMER_SESSION_COLLECTION = 'customer_sessions';
export const EMPLOYEE_SESSION_COLLECTION = 'employee_sessions';

export interface CustomerSessionDocument {
  _id: string;
  customerAccountId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeSessionDocument {
  _id: string;
  employeeAccountId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const customerSessionIndexes = [
  { key: { customerAccountId: 1 }, options: {} },
  { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
] as const;

export const employeeSessionIndexes = [
  { key: { employeeAccountId: 1 }, options: {} },
  { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } },
] as const;
