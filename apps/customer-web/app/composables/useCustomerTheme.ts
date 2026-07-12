import {
  applyCustomerThemeToDocument,
  persistCustomerThemePreference,
  readStoredCustomerThemePreference,
  resolveCustomerThemePreference,
  type CustomerThemePreference,
  type CustomerResolvedTheme,
} from '~/lib/customer-theme';

export function useCustomerTheme() {
  const preference = useState<CustomerThemePreference>(
    'customer-theme-preference',
    () => 'light',
  );
  const resolved = useState<CustomerResolvedTheme>('customer-theme-resolved', () => 'light');
  const ready = useState('customer-theme-ready', () => false);
  // False once the user picks a theme manually; while true the app tracks the OS setting live.
  const followsSystem = useState('customer-theme-follows-system', () => true);

  let media: MediaQueryList | undefined;
  let mediaListener: ((event: MediaQueryListEvent) => void) | undefined;

  function detachMediaListener() {
    if (media && mediaListener) {
      media.removeEventListener('change', mediaListener);
    }
    media = undefined;
    mediaListener = undefined;
  }

  function attachMediaListener() {
    if (!import.meta.client || typeof window.matchMedia !== 'function') {
      return;
    }

    detachMediaListener();
    media = window.matchMedia('(prefers-color-scheme: dark)');
    mediaListener = (event) => {
      // An explicit stored preference always wins over the OS setting.
      if (readStoredCustomerThemePreference()) {
        return;
      }

      const next: CustomerResolvedTheme = event.matches ? 'dark' : 'light';
      resolved.value = next;
      followsSystem.value = true;
      applyCustomerThemeToDocument(next);
    };
    media.addEventListener('change', mediaListener);
  }

  function syncFromDocument() {
    if (!import.meta.client) {
      return;
    }

    const stored = readStoredCustomerThemePreference();
    const next = resolveCustomerThemePreference();
    preference.value = stored ?? next;
    resolved.value = next;
    followsSystem.value = !stored;
    applyCustomerThemeToDocument(next);
    ready.value = true;
    attachMediaListener();
  }

  function setTheme(next: CustomerThemePreference) {
    if (!import.meta.client) {
      return;
    }

    preference.value = next;
    resolved.value = next;
    followsSystem.value = false;
    persistCustomerThemePreference(next);
    applyCustomerThemeToDocument(next);
  }

  function toggleTheme() {
    setTheme(resolved.value === 'dark' ? 'light' : 'dark');
  }

  const isDark = computed(() => resolved.value === 'dark');

  onMounted(() => {
    syncFromDocument();
  });

  onUnmounted(() => {
    detachMediaListener();
  });

  return {
    preference,
    resolved,
    ready,
    isDark,
    followsSystem,
    setTheme,
    toggleTheme,
    syncFromDocument,
  };
}
