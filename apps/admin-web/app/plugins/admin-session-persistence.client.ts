import type { AdminSessionState } from '~/types/admin-session';
import type { AdminCapabilities } from '~/types/admin-capabilities';

export default defineNuxtPlugin(async () => {
  const session = useState<AdminSessionState | null>('admin-session', () => null);
  const sessionResolved = useState('admin-session-resolved', () => false);
  const route = useRoute();

  if (route.path.startsWith('/auth')) {
    sessionResolved.value = true;
    return;
  }

  const capabilities = useState<AdminCapabilities | null>('admin-capabilities', () => null);
  const capabilitiesResolved = useState('admin-capabilities-resolved', () => false);

  try {
    const [meResult, capabilitiesResult] = await Promise.allSettled([
      $fetch<AdminSessionState>('/api/auth/session/me', { credentials: 'same-origin' }),
      $fetch<AdminCapabilities>('/api/auth/capabilities', { credentials: 'same-origin' }),
    ]);

    session.value = meResult.status === 'fulfilled' ? meResult.value : null;
    capabilities.value = capabilitiesResult.status === 'fulfilled' ? capabilitiesResult.value : null;
  } catch {
    session.value = null;
    capabilities.value = null;
  } finally {
    sessionResolved.value = true;
    capabilitiesResolved.value = true;
  }
});
