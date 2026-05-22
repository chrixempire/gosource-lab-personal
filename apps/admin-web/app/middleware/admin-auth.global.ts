import { useAdminSession } from '~/composables/useAdminSession';

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
    return navigateTo('/auth/sign-in');
  }
});
