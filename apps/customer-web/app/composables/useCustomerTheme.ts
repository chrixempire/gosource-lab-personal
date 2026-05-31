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

  function syncFromDocument() {
    if (!import.meta.client) {
      return;
    }

    const next = resolveCustomerThemePreference();
    preference.value = readStoredCustomerThemePreference() ?? next;
    resolved.value = next;
    applyCustomerThemeToDocument(next);
    ready.value = true;
  }

  function setTheme(next: CustomerThemePreference) {
    if (!import.meta.client) {
      return;
    }

    preference.value = next;
    resolved.value = next;
    persistCustomerThemePreference(next);
    applyCustomerThemeToDocument(next);
  }

  function toggleTheme() {
    setTheme(resolved.value === 'dark' ? 'light' : 'dark');
  }

  const isDark = computed(() => resolved.value === 'dark');

  onMounted(() => {
    syncFromDocument();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (!readStoredCustomerThemePreference()) {
        const next = media.matches ? 'dark' : 'light';
        resolved.value = next;
        applyCustomerThemeToDocument(next);
      }
    };

    media.addEventListener('change', onSystemChange);
    onUnmounted(() => media.removeEventListener('change', onSystemChange));
  });

  return {
    preference,
    resolved,
    ready,
    isDark,
    setTheme,
    toggleTheme,
    syncFromDocument,
  };
}
