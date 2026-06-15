import type { H3Event } from 'h3';
import { getAdminSessionSnapshot } from './admin-auth-session';
import { fetchAdminLegacyApi } from './admin-legacy-proxy';

const SUPER_ADMIN_ROLES = new Set(['super_admin', 'admin', 'super admin']);

function isSuperAdminRole(role: string | undefined) {
  if (!role) return false;
  return SUPER_ADMIN_ROLES.has(role.trim().toLowerCase());
}

async function probeLegacyGet(event: H3Event, path: string, query?: Record<string, string | number>) {
  try {
    await fetchAdminLegacyApi(event, path, {
      query,
      fallbackMessage: 'Unable to verify permission',
    });
    return true;
  } catch {
    return false;
  }
}

export async function resolveAdminCapabilities(event: H3Event) {
  const snapshot = getAdminSessionSnapshot(event);
  const role = snapshot?.data?.role;

  if (isSuperAdminRole(role)) {
    return {
      viewCredits: true,
      viewCreditAnalytics: true,
      manageCredit: true,
      viewActivityLogs: false, // Feature disabled
    };
  }

  const [viewCreditAnalytics, viewCredits] = await Promise.all([
    probeLegacyGet(event, '/admin/credit/requests/stats'),
    probeLegacyGet(event, '/admin/credit/requests', { page: 1, limit: 1 }),
    // probeLegacyGet(event, '/admin/activity', { page: 1, limit: 1 }),
  ]);

  return {
    viewCredits,
    viewCreditAnalytics,
    manageCredit: false,
    viewActivityLogs: false, // Feature disabled
  };
}
