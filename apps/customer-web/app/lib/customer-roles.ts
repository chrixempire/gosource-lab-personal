import type { CustomerMeResponse } from '@gosource/api-client';

const BUSINESS_OWNER_ROLES = new Set(['super_admin', 'Super Admin', 'super admin']);

export function isBusinessOwnerRole(role: string | null | undefined): boolean {
  if (!role) {
    return false;
  }

  return BUSINESS_OWNER_ROLES.has(role.trim());
}

/** Business customer (owner) sessions are treated as Super Admin for cart checkout. */
export function isBusinessOwnerSession(
  session: CustomerMeResponse | null | undefined,
): boolean {
  if (!session) {
    return false;
  }

  if (session.user_type === 'customer') {
    return true;
  }

  const role =
    session.data && typeof session.data === 'object' && 'role' in session.data
      ? String(session.data.role ?? '')
      : '';

  return isBusinessOwnerRole(role);
}
