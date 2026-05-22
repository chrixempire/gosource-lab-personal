import { useCustomerSession } from '~/composables/useCustomerSession';

function isPublicCustomerRoute(path: string) {
  return path === '/' || path.startsWith('/auth');
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (isPublicCustomerRoute(to.path)) {
    return;
  }

  const { hasSession, whenReady } = useCustomerSession();

  if (import.meta.client) {
    await whenReady();
  }

  if (!hasSession.value) {
    return navigateTo('/auth/sign-in');
  }
});
