// Activity log feature disabled — restore middleware body when re-enabling.
export default defineNuxtRouteMiddleware(() => {});

// import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
//
// export default defineNuxtRouteMiddleware(async (to) => {
//   if (!to.path.startsWith(ADMIN_PAGE_ROUTES.ACTIVITY_LOG)) {
//     return;
//   }
//
//   const { ensureCapabilities, canAccessRoute } = useAdminCapabilities();
//   await ensureCapabilities();
//
//   if (!canAccessRoute(to.path)) {
//     return navigateTo(ADMIN_PAGE_ROUTES.HOME);
//   }
// });
