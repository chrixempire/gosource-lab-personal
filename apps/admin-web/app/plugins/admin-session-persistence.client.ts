import type { AdminSessionState } from '~/types/admin-session';

export default defineNuxtPlugin(async () => {
  const session = useState<AdminSessionState | null>('admin-session', () => null);
  const sessionResolved = useState('admin-session-resolved', () => false);
  const route = useRoute();

  if (route.path.startsWith('/auth')) {
    sessionResolved.value = true;
    return;
  }

  try {
    const response = await $fetch<AdminSessionState>('/api/auth/session/me', {
      credentials: 'same-origin',
    });
    session.value = response;
  } catch {
    session.value = null;
  } finally {
    sessionResolved.value = true;
  }
});
