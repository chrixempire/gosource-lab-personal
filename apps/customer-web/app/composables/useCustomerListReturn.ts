import type { RouteLocationNormalizedLoaded } from 'vue-router';
import {
  MANAGE_REQUESTS_LIST_PATH,
  sanitizeManageRequestsListReturn,
} from '~/lib/customer-list-return';

/**
 * Remembers the last manage-requests list URL (including branch filter query)
 * so checkout and detail back-navigation can restore the user's list context.
 */
export function useCustomerListReturn() {
  const manageRequestsListReturnPath = useState<string>(
    'customer-manage-requests-list-return',
    () => MANAGE_REQUESTS_LIST_PATH,
  );

  function rememberManageRequestsListPath(route: RouteLocationNormalizedLoaded) {
    if (route.path !== MANAGE_REQUESTS_LIST_PATH) {
      return;
    }

    manageRequestsListReturnPath.value = sanitizeManageRequestsListReturn(route.fullPath);
  }

  async function navigateToManageRequestsList(options?: { replace?: boolean }) {
    const target = sanitizeManageRequestsListReturn(manageRequestsListReturnPath.value);
    return navigateTo(target, { replace: options?.replace ?? false });
  }

  return {
    manageRequestsListReturnPath,
    rememberManageRequestsListPath,
    navigateToManageRequestsList,
  };
}
