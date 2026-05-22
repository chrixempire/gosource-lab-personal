export type AdminUserStatus = 'active' | 'inactive' | 'suspended' | 'terminated' | string;

export type AdminUserListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roleId: string | null;
  status: AdminUserStatus;
  statusLabel: string;
  createdAt: string | null;
  createdAtLabel: string;
};

export type AdminRoleListItem = {
  id: string;
  name: string;
  description: string;
  userCount: number;
  createdAt: string | null;
  createdAtLabel: string;
};

export type AdminRoleDetail = AdminRoleListItem & {
  permissions: string[];
  members: AdminRoleMember[];
};

export type AdminRoleMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: AdminUserStatus;
  statusLabel: string;
};

export type PermissionOption = {
  value: string;
  label: string;
};

export type PermissionSection = {
  title: string;
  items: PermissionOption[];
};

export type DeliveryFeeConfig = {
  threshold: number;
  baseFee1: number;
  baseFee2: number;
  percentage1: number;
  percentage2: number;
};

export type SystemConfigEntry = {
  key: string;
  value: unknown;
  description?: string | null;
};

export type SettingsProfileFormValues = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export type SettingsRoleFormValues = {
  name: string;
  description: string;
  permissions: string[];
};
