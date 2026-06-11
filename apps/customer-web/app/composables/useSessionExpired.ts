import { SESSION_EXPIRED_MESSAGE } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { useCustomerSignOut } from '~/composables/useCustomerSignOut';
import { customerSignInLocation } from '~/lib/auth-redirect';

let handlingSessionExpired = false;

/**
 * Clear customer auth, show session-expired toast, and send user to sign-in with return path.
 */
export function useSessionExpired() {
  const route = useRoute();
  const { sessionResolved, clearSession } = useCustomerSession();
  const { isIntentionalSignOut } = useCustomerSignOut();

  async function handleSessionExpired() {
    if (!import.meta.client || handlingSessionExpired) {
      return;
    }

    if (isIntentionalSignOut() || route.path.startsWith('/auth')) {
      return;
    }

    handlingSessionExpired = true;
    const returnPath = route.fullPath;

    clearSession();
    sessionResolved.value = true;

    try {
      await $fetch('/api/auth/session/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // Cookies may already be cleared by a failed refresh on the server.
    }

    toast.error(SESSION_EXPIRED_MESSAGE);

    try {
      await navigateTo(customerSignInLocation(returnPath), { replace: true });
    } finally {
      handlingSessionExpired = false;
    }
  }

  return {
    handleSessionExpired,
  };
}
