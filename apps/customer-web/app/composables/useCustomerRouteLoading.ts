/**
 * Shows immediate navigation feedback on client-side route changes — especially
 * when target pages use lazy/fastNav and Nuxt's loading indicator finishes quickly.
 */
export function useCustomerRouteLoading() {
  const isNavigating = useState('customer-route-navigating', () => false);

  if (import.meta.client) {
    const router = useRouter();

    router.beforeEach((to, from) => {
      if (to.path !== from.path) {
        isNavigating.value = true;
      }
    });

    router.afterEach(() => {
      nextTick(() => {
        isNavigating.value = false;
      });
    });

    router.onError(() => {
      isNavigating.value = false;
    });
  }

  return { isNavigating };
}
