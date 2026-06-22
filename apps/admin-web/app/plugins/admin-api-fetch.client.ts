import type { AdminSessionState } from '~/types/admin-session';
import {
  SESSION_REFRESH_PATH,
  createSessionRefreshCoordinator,
  wrapFetchWithSessionRetry,
} from '@gosource/api-client';

/**
 * On any client /api 401, POST session refresh (legacy /admin/auth/refresh + new cookies),
 * update admin-session, then retry the failed request once.
 */
export default defineNuxtPlugin(() => {
  const originalFetch = globalThis.$fetch;
  const session = useState<AdminSessionState | null>('admin-session');
  const { handleSessionExpired } = useSessionExpired();

  const refreshSession = createSessionRefreshCoordinator(async () => {
    const refreshed = await originalFetch<AdminSessionState>(SESSION_REFRESH_PATH, {
      method: 'POST',
      credentials: 'same-origin',
    });
    session.value = refreshed;
  });

  globalThis.$fetch = wrapFetchWithSessionRetry(originalFetch as never, {
    refreshSession,
    onSessionRefreshFailed: handleSessionExpired,
  }) as typeof globalThis.$fetch;
});
