import { clearAdminSessionCaches } from '~/composables/clearAdminSessionCaches';
import { getAdminSessionCacheSignature } from '~/lib/admin-session-cache';
import type { AdminSessionState } from '~/types/admin-session';

export function useAdminSession() {
  const session = useState<AdminSessionState | null>('admin-session', () => null);
  const sessionResolved = useState('admin-session-resolved', () => import.meta.server);

  const hasSession = computed(() => Boolean(session.value?.data?.id));

  async function whenReady() {
    if (sessionResolved.value) {
      return;
    }

    if (import.meta.server) {
      return;
    }

    await new Promise<void>((resolve) => {
      const stop = watch(
        sessionResolved,
        (resolved) => {
          if (resolved) {
            stop();
            resolve();
          }
        },
        { immediate: true },
      );
    });
  }

  function adoptSession(value: AdminSessionState) {
    if (import.meta.client) {
      const previousSignature = getAdminSessionCacheSignature(session.value);
      const nextSignature = getAdminSessionCacheSignature(value);
      if (previousSignature !== nextSignature) {
        clearAdminSessionCaches();
      }
    }

    session.value = value;
  }

  function clearSession() {
    if (import.meta.client) {
      clearAdminSessionCaches();
    }

    session.value = null;
  }

  return {
    session,
    sessionResolved,
    hasSession,
    whenReady,
    adoptSession,
    clearSession,
  };
}
