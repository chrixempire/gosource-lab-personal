import type { AdminSessionState } from '~/types/admin-session';
import {
  fetchAdminProfile,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  getAdminSessionSnapshot,
  refreshAdminSession,
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
  const refreshToken = getRefreshTokenCookie(event);

  if (!accessToken && !refreshToken) {
    session.value = null;
    sessionResolved.value = true;
    return;
  }

  try {
    if (!accessToken && refreshToken) {
      session.value = await refreshAdminSession(event);
      return;
    }

    session.value = await fetchAdminProfile(event, accessToken!, { mergeWith: snapshot });
  } catch (error) {
    const unauthorized =
      typeof error === 'object' &&
      error !== null &&
      (Number((error as { status?: number; statusCode?: number }).status) === 401 ||
        Number((error as { status?: number; statusCode?: number }).statusCode) === 401);

    if (refreshToken && unauthorized) {
      try {
        session.value = await refreshAdminSession(event);
        return;
      } catch {
        session.value = snapshot ?? null;
        return;
      }
    }

    session.value = snapshot ?? null;
  } finally {
    sessionResolved.value = true;
  }
});
