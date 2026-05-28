import { toast } from '@gosource/ui';
import { SESSION_EXPIRED_MESSAGE } from '@gosource/api-client';
import { adminSignInLocation } from '~/lib/auth-redirect';
import type { AdminSessionState } from '~/types/admin-session';

let handlingSessionExpired = false;

/**
 * Clear admin auth, show session-expired toast, and send user to sign-in with return path.
 */
export function useSessionExpired() {
  const route = useRoute();
  const session = useState<AdminSessionState | null>('admin-session', () => null);
  const sessionResolved = useState('admin-session-resolved', () => false);

  async function handleSessionExpired() {
    if (!import.meta.client || handlingSessionExpired) {
      return;
    }

    if (route.path.startsWith('/auth')) {
      return;
    }

    handlingSessionExpired = true;
    const returnPath = route.fullPath;

    session.value = null;
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
