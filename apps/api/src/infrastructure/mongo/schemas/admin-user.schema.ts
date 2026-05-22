export const ADMIN_USER_COLLECTION = 'adminusers';

export interface AdminUserDocument {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  passwordHash: string;
  roleId: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export const adminUserIndexes = [
  { key: { email: 1 }, options: { unique: true } },
  { key: { roleId: 1 } },
] as const;
