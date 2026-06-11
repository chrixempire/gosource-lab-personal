import { toast } from '@gosource/ui';
import { SESSION_EXPIRED_MESSAGE } from '@gosource/api-client';
import { useAdminSession } from '~/composables/useAdminSession';
import { adminSignInLocation } from '~/lib/auth-redirect';

let handlingSessionExpired = false;

/**
 * Clear admin auth, show session-expired toast, and send user to sign-in with return path.
 */
export function useSessionExpired() {
  const route = useRoute();
  const { sessionResolved, clearSession } = useAdminSession();

  async function handleSessionExpired() {
    if (!import.meta.client || handlingSessionExpired) {
      return;
    }

    if (route.path.startsWith('/auth')) {
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
      await navigateTo(adminSignInLocation(returnPath), { replace: true });
    } finally {
      handlingSessionExpired = false;
    }
  }

  return {
    handleSessionExpired,
  };
}
