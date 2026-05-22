export interface AdminUserInterface {
  firstName: string;
  lastName: string;
  email: string;
  callbackUrl?: string;
  roleIds?: string[];
}

export interface AdminRoleInterface {
  name: string;
}
