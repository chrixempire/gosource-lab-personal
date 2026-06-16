import type { AdminSessionState } from '~/types/admin-session';

/** Stable per-user suffix for route/async-data caches (resets on account switch). */
export function getAdminSessionCacheSignature(
  session: AdminSessionState | null | undefined,
): string {
  if (!session?.data?.id) {
    return 'anonymous';
  }

  const role = String(session.data.role ?? '').trim().toLowerCase();
  return `${session.data.id}:${role}`;
}
