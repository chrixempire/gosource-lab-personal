import {
  createApiClient,
  createBranchApi,
  createCustomerAuthApi,
  createEmployeeApi,
  createOrderApi,
  createRequestApi,
  createShoppingListApi,
  createWalletApi,
} from '@gosource/api-client';
import type { CustomerMeResponse } from '@gosource/api-client';

export default defineNuxtPlugin(() => {
  const route = useRoute();
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined;
  const proxyBaseURL = import.meta.server
    ? new URL('/api/proxy', useRequestURL().origin).toString()
    : '/api/proxy';

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
    onAuthFailure: async () => {
      session.value = null;

      if (import.meta.client && !route.path.startsWith('/auth')) {
        await navigateTo('/auth/sign-in');
      }
    },
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
  }
}
