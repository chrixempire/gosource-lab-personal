import type { AdminUserStatus } from '~/types/settings';

export const SETTINGS_TABS = [
  { value: '/settings', label: 'General' },
  { value: '/settings/security', label: 'Security' },
  { value: '/settings/users', label: 'Users' },
  { value: '/settings/roles-permissions', label: 'Roles & permissions' },
  { value: '/settings/fees-charges', label: 'Fees & charges' },
] as const;

export const SETTINGS_TAB_PATHS = SETTINGS_TABS.map((tab) => tab.value);

export const ADMIN_USER_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Pending',
  suspended: 'Suspended',
  terminated: 'Terminated',
};

export function adminUserStatusLabel(status: string) {
  return ADMIN_USER_STATUS_LABELS[status] ?? status;
}

export function adminUserStatusVariant(
  status: AdminUserStatus,
): 'success' | 'warning' | 'default' | 'negative' {
  if (status === 'active') return 'success';
  if (status === 'inactive') return 'warning';
  if (status === 'suspended' || status === 'terminated') return 'negative';
  return 'default';
}

/** Matches table status chips elsewhere in admin-web (`size="medium"` → `rounded-lg`). */
export const SETTINGS_TABLE_STATUS_TAG_CLASS = 'rounded-lg normal-case';

export function formatAdminRoleLabel(role: string) {
  return role
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
