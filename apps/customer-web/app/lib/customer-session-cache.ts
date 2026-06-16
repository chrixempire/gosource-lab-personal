import type { CustomerMeResponse } from '@gosource/api-client';

/** Stable per-user suffix for route/async-data caches (survives SPA navigation, resets on account switch). */
export function getCustomerSessionCacheSignature(
  session: CustomerMeResponse | null | undefined,
): string {
  if (!session?.data) {
    return 'anonymous';
  }

  const businessId = String(session.data.businessId ?? '');
  const userType = session.user_type ?? 'unknown';
  const actorId = String(session.data.id ?? '');
  const role =
    'role' in session.data ? String(session.data.role ?? '').trim().toLowerCase() : '';

  return `${userType}:${businessId}:${actorId}:${role}`;
}
