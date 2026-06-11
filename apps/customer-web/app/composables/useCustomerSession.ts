import type { CustomerMeResponse } from '@gosource/api-client';
import { clearCustomerSessionCaches } from '~/composables/clearCustomerSessionCaches';
import { resetCustomerUserScopedState } from '~/composables/resetCustomerUserScopedState';
import { getCustomerSessionCacheSignature } from '~/lib/customer-session-cache';

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

  function adoptSession(value: CustomerMeResponse) {
    if (import.meta.client) {
      const previousSignature = getCustomerSessionCacheSignature(session.value);
      const nextSignature = getCustomerSessionCacheSignature(value);
      if (previousSignature !== nextSignature) {
        clearCustomerSessionCaches();
        resetCustomerUserScopedState();
      }
    }

    session.value = value;
  }

  function clearSession() {
    if (import.meta.client) {
      clearCustomerSessionCaches();
      resetCustomerUserScopedState();
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
