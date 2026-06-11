import {
  SESSION_REFRESH_PATH,
  createApiClient,
  createBranchApi,
  createCustomerAuthApi,
  createEmployeeApi,
  createOrderApi,
  createRequestApi,
  createSessionRefreshCoordinator,
  createShoppingListApi,
  createCreditApi,
  createWalletApi,
  wrapFetchWithSessionRetry,
} from '@gosource/api-client';
import type { CustomerMeResponse } from '@gosource/api-client';
import { useCustomerSignOut } from '~/composables/useCustomerSignOut';

export default defineNuxtPlugin(() => {
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const { handleSessionExpired } = useSessionExpired();
  const { isIntentionalSignOut } = useCustomerSignOut();

  async function onSessionRefreshFailed() {
    if (isIntentionalSignOut()) {
      return;
    }

    await handleSessionExpired();
  }
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined;
  const proxyBaseURL = import.meta.server
    ? new URL('/api/proxy', useRequestURL().origin).toString()
    : '/api/proxy';

  const originalFetch = globalThis.$fetch;

  const refreshSession = import.meta.client
    ? createSessionRefreshCoordinator(async () => {
        const refreshed = await originalFetch<CustomerMeResponse>(SESSION_REFRESH_PATH, {
          method: 'POST',
          credentials: 'same-origin',
        });
        session.value = refreshed;
      })
    : async () => {};

  if (import.meta.client) {
    globalThis.$fetch = wrapFetchWithSessionRetry(originalFetch, {
      refreshSession,
      onSessionRefreshFailed: onSessionRefreshFailed,
    });
  }

  const apiClient = createApiClient({
    baseURL: proxyBaseURL,
    getDefaultHeaders: () => {
      if (!import.meta.server) {
        return undefined;
      }

      const headers: Record<string, string> = {};
      if (requestHeaders?.cookie) {
        headers.cookie = requestHeaders.cookie;
      }
      return headers;
    },
    onSessionRefresh: refreshSession,
    onSessionExpired: onSessionRefreshFailed,
  });

  return {
    provide: {
      apiClient,
      customerAuthApi: createCustomerAuthApi(apiClient),
      branchApi: createBranchApi(apiClient),
      employeeApi: createEmployeeApi(apiClient),
      requestApi: createRequestApi(apiClient),
      orderApi: createOrderApi(apiClient),
      shoppingListApi: createShoppingListApi(apiClient),
      walletApi: createWalletApi(apiClient),
      creditApi: createCreditApi(apiClient),
    },
  };
});

declare module '#app' {
  interface NuxtApp {
    $apiClient: ReturnType<typeof createApiClient>;
    $customerAuthApi: ReturnType<typeof createCustomerAuthApi>;
    $branchApi: ReturnType<typeof createBranchApi>;
    $employeeApi: ReturnType<typeof createEmployeeApi>;
    $requestApi: ReturnType<typeof createRequestApi>;
    $orderApi: ReturnType<typeof createOrderApi>;
    $shoppingListApi: ReturnType<typeof createShoppingListApi>;
    $walletApi: ReturnType<typeof createWalletApi>;
    $creditApi: ReturnType<typeof createCreditApi>;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $apiClient: ReturnType<typeof createApiClient>;
    $customerAuthApi: ReturnType<typeof createCustomerAuthApi>;
    $branchApi: ReturnType<typeof createBranchApi>;
    $employeeApi: ReturnType<typeof createEmployeeApi>;
    $requestApi: ReturnType<typeof createRequestApi>;
    $orderApi: ReturnType<typeof createOrderApi>;
    $shoppingListApi: ReturnType<typeof createShoppingListApi>;
    $walletApi: ReturnType<typeof createWalletApi>;
    $creditApi: ReturnType<typeof createCreditApi>;
  }
}
