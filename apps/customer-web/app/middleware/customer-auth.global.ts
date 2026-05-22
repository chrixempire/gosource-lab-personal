import { useCustomerSession } from '~/composables/useCustomerSession';
import { customerSignInLocation } from '~/lib/auth-redirect';

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
    return navigateTo(customerSignInLocation(to.fullPath));
  }
});
