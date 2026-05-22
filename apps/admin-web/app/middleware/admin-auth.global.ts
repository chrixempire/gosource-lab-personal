import { useAdminSession } from '~/composables/useAdminSession';
import { adminSignInLocation } from '~/lib/auth-redirect';

function isPublicAdminRoute(path: string) {
  if (path.startsWith('/auth')) {
    return true;
  }

  return import.meta.dev && path.startsWith('/dev');
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (isPublicAdminRoute(to.path)) {
    return;
  }

  const { hasSession, whenReady } = useAdminSession();

  if (import.meta.client) {
    await whenReady();
  }

  if (!hasSession.value) {
    return navigateTo(adminSignInLocation(to.fullPath));
  }
});
