import type { EmployeeRole } from './employee.schema';

export const EMPLOYEE_INVITE_COLLECTION = 'employeeinvites';

export interface EmployeeInviteDocument {
  _id: string;
  email: string;
  businessId: string;
  branchId: string;
  role: EmployeeRole;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  callbackUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export const employeeInviteIndexes = [
  { key: { businessId: 1, branchId: 1, email: 1 }, options: { unique: true } },
] as const;
