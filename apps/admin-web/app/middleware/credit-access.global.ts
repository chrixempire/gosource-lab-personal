import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/credit')) {
    return;
  }

  const { ensureCapabilities, canAccessRoute } = useAdminCapabilities();
  await ensureCapabilities();

  if (!canAccessRoute(to.path)) {
    return navigateTo(ADMIN_PAGE_ROUTES.HOME);
  }
});
