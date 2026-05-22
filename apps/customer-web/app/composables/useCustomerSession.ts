import type { CustomerMeResponse } from '@gosource/api-client';

/**
 * Client session bootstrap from /api/auth/session/me (see customer-session-persistence plugins).
 * Pages must not fetch protected data until `whenReady()` resolves on the client.
 */
export function useCustomerSession() {
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const sessionResolved = useState('customer-session-resolved', () => import.meta.server);

  const hasSession = computed(() => Boolean(session.value?.data?.businessId));

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

  return {
    session,
    sessionResolved,
    hasSession,
    whenReady,
  };
}
