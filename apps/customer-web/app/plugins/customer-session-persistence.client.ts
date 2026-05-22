import type { CustomerMeResponse } from '@gosource/api-client';

export default defineNuxtPlugin(async () => {
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const sessionResolved = useState('customer-session-resolved', () => false);
  const route = useRoute();

  if (route.path.startsWith('/auth')) {
    sessionResolved.value = true;
    return;
  }

  if (session.value?.data?.businessId) {
    sessionResolved.value = true;
    return;
  }

  try {
    const response = await $fetch<CustomerMeResponse>('/api/auth/session/me', {
      credentials: 'same-origin',
    });
    session.value = response;
  } catch {
    session.value = null;
  } finally {
    sessionResolved.value = true;
  }
});
