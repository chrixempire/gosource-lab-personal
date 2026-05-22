const STORAGE_PREFIX = 'gosource:customer:branch-setup-dismissed:';

function resolveStorageKey(session: {
  data?: { businessId?: string | null; email?: string | null };
} | null) {
  const businessId = session?.data?.businessId?.trim();
  if (businessId) {
    return `${STORAGE_PREFIX}${businessId}`;
  }

  const email = session?.data?.email?.trim().toLowerCase();
  if (email) {
    return `${STORAGE_PREFIX}${email}`;
  }

  return null;
}

export function useMarketBranchSetupDismissal() {
  const session = useState<{
    data?: { businessId?: string | null; email?: string | null };
  } | null>('customer-session', () => null);

  const dismissed = useState('market-branch-setup-dismissed', () => false);

  function readDismissedFromStorage() {
    if (!import.meta.client) {
      return false;
    }

    const key = resolveStorageKey(session.value);
    if (!key) {
      return false;
    }

    return localStorage.getItem(key) === '1';
  }

  function syncDismissedFromStorage() {
    dismissed.value = readDismissedFromStorage();
  }

  function dismiss() {
    dismissed.value = true;

    if (!import.meta.client) {
      return;
    }

    const key = resolveStorageKey(session.value);
    if (key) {
      localStorage.setItem(key, '1');
    }
  }

  function clearDismissalForSession() {
    dismissed.value = false;

    if (!import.meta.client) {
      return;
    }

    const key = resolveStorageKey(session.value);
    if (key) {
      localStorage.removeItem(key);
    }
  }

  function clearAllDismissals() {
    dismissed.value = false;

    if (!import.meta.client) {
      return;
    }

    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      syncDismissedFromStorage();
    });

    watch(
      () => [session.value?.data?.businessId, session.value?.data?.email] as const,
      () => {
        syncDismissedFromStorage();
      },
    );
  }

  return {
    dismissed,
    dismiss,
    syncDismissedFromStorage,
    clearDismissalForSession,
    clearAllDismissals,
  };
}
