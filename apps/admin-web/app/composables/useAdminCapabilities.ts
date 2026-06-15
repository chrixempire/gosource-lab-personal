import type { AdminCapabilities } from '~/types/admin-capabilities';
import { canAccessAdminRoute, canManageCredit } from '~/lib/admin-permissions';

export function useAdminCapabilities() {
  const capabilities = useState<AdminCapabilities | null>('admin-capabilities', () => null);
  const resolved = useState('admin-capabilities-resolved', () => false);
  const requestFetch = import.meta.server ? useRequestFetch() : null;

  async function ensureCapabilities() {
    if (resolved.value) {
      return capabilities.value;
    }

    try {
      const fetchCapabilities = requestFetch ?? $fetch;
      capabilities.value = await fetchCapabilities<AdminCapabilities>('/api/auth/capabilities', {
        credentials: 'same-origin',
      });
    } catch {
      capabilities.value = {
        viewCredits: false,
        viewCreditAnalytics: false,
        manageCredit: false,
        viewActivityLogs: false,
      };
    } finally {
      resolved.value = true;
    }

    return capabilities.value;
  }

  const canManage = computed(() => canManageCredit(capabilities.value));

  function canAccessRoute(path: string) {
    return canAccessAdminRoute(path, capabilities.value);
  }

  return {
    capabilities,
    resolved,
    ensureCapabilities,
    canManage,
    canAccessRoute,
  };
}
