export const EMPLOYEE_COLLECTION = 'employees';

export type EmployeeRole = 'manager' | 'employee';

export interface EmployeeDocument {
  _id: string;
  businessId: string;
  branchId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  normalizedPhoneNumber: string;
  position: string;
  role: EmployeeRole;
  passwordHash: string;
  verifiedAt: Date | null;
  status: 'active' | 'inactive' | 'pending';
  isDeactivated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const employeeIndexes = [
  { key: { email: 1 }, options: { unique: true } },
  { key: { normalizedPhoneNumber: 1 }, options: { unique: true } },
  { key: { businessId: 1 }, options: {} },
  { key: { branchId: 1 }, options: {} },
] as const;
