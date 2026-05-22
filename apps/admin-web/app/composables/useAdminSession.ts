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

  function clearSession() {
    session.value = null;
  }

  return {
    session,
    sessionResolved,
    hasSession,
    whenReady,
    clearSession,
  };
}
