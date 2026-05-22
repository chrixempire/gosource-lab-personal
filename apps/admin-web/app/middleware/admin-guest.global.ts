import { useAdminSession } from '~/composables/useAdminSession';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/auth')) {
    return;
  }

  const { hasSession, whenReady } = useAdminSession();

  if (import.meta.client) {
    await whenReady();
  }

  if (hasSession.value) {
    return navigateTo('/');
  }
});
