import type { AdminCapabilities } from '~/types/admin-capabilities';
import type { AdminNavItem } from '~/lib/admin-routes';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';

export const ADMIN_PERMISSION = {
  VIEW_CREDIT_ANALYTICS: 'view_credit_analytics',
  VIEW_CREDITS: 'view_credits',
  MANAGE_CREDIT: 'manage_credit',
} as const;

const SUPER_ADMIN_ROLES = new Set(['super_admin', 'admin', 'super admin']);

export function isSuperAdminRole(role: string | undefined) {
  if (!role) return false;
  return SUPER_ADMIN_ROLES.has(role.trim().toLowerCase());
}

export function canViewCreditAnalytics(capabilities: AdminCapabilities | null | undefined) {
  if (!capabilities) return true;
  return capabilities.viewCreditAnalytics;
}

export function canViewCredits(capabilities: AdminCapabilities | null | undefined) {
  if (!capabilities) return true;
  return capabilities.viewCredits;
}

export function canManageCredit(capabilities: AdminCapabilities | null | undefined) {
  if (!capabilities) return true;
  return capabilities.manageCredit;
}

export function canAccessCreditPath(
  path: string,
  capabilities: AdminCapabilities | null | undefined,
) {
  if (!path.startsWith('/credit')) return true;
  if (path.startsWith(ADMIN_PAGE_ROUTES.CREDIT_ANALYTICS)) {
    return canViewCreditAnalytics(capabilities);
  }
  return canViewCredits(capabilities);
}

export function filterAdminNavByCapabilities(
  items: AdminNavItem[],
  capabilities: AdminCapabilities | null | undefined,
): AdminNavItem[] {
  return items
    .map((item) => {
      if (item.label !== 'Credit' || !item.children?.length) {
        return item;
      }

      const children = item.children.filter((child) => {
        if (child.to === ADMIN_PAGE_ROUTES.CREDIT_ANALYTICS) {
          return canViewCreditAnalytics(capabilities);
        }
        return canViewCredits(capabilities);
      });

      if (children.length === 0) {
        return null;
      }

      return { ...item, children };
    })
    .filter((item): item is AdminNavItem => item !== null);
}
