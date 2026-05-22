import type { AdminSessionState } from '~/types/admin-session';
import {
  fetchAdminProfile,
  getAccessTokenCookie,
  getAdminSessionSnapshot,
} from '~~/server/utils/admin-auth-session';

export default defineNuxtPlugin(async () => {
  const session = useState<AdminSessionState | null>('admin-session', () => null);
  const sessionResolved = useState('admin-session-resolved', () => false);
  const route = useRoute();
  const event = useRequestEvent();

  if (route.path.startsWith('/auth')) {
    sessionResolved.value = true;
    return;
  }

  if (!event) {
    sessionResolved.value = true;
    return;
  }

  const snapshot = getAdminSessionSnapshot(event);
  if (snapshot) {
    session.value = snapshot;
  }

  const accessToken = getAccessTokenCookie(event);
  if (!accessToken) {
    session.value = null;
    sessionResolved.value = true;
    return;
  }

  try {
    session.value = await fetchAdminProfile(event, accessToken, { mergeWith: snapshot });
  } catch {
    if (!snapshot) {
      session.value = null;
    }
  } finally {
    sessionResolved.value = true;
  }
});
