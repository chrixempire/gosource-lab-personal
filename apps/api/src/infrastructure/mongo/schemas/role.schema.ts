export const ROLE_COLLECTION = 'roles';

export interface RoleDocument {
  _id: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const roleIndexes = [
  { key: { name: 1 }, options: { unique: true } },
] as const;
