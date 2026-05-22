import { createAdminAuthApi, createApiClient } from '@gosource/api-client';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const apiClient = createApiClient({
    baseURL: config.public.legacyApiBaseUrl,
  });

  return {
    provide: {
      apiClient,
      adminAuthApi: createAdminAuthApi(apiClient),
    },
  };
});

declare module '#app' {
  interface NuxtApp {
    $apiClient: ReturnType<typeof createApiClient>;
    $adminAuthApi: ReturnType<typeof createAdminAuthApi>;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $apiClient: ReturnType<typeof createApiClient>;
    $adminAuthApi: ReturnType<typeof createAdminAuthApi>;
  }
}
