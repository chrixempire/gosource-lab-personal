import {
  applyCustomerThemeToDocument,
  persistCustomerThemePreference,
  readStoredCustomerThemePreference,
  resolveCustomerThemePreference,
  type CustomerThemePreference,
  type CustomerResolvedTheme,
} from '~/lib/customer-theme';
import {
  getCustomerScheduleTheme,
  getMsUntilNextScheduleThemeFlip,
} from '~/lib/customer-time-of-day';

export function useCustomerTheme() {
  const preference = useState<CustomerThemePreference>(
    'customer-theme-preference',
    () => 'light',
  );
  const resolved = useState<CustomerResolvedTheme>('customer-theme-resolved', () => 'light');
  const ready = useState('customer-theme-ready', () => false);

  let scheduleTimer: ReturnType<typeof setTimeout> | undefined;

  function clearScheduleTimer() {
    if (scheduleTimer) {
      clearTimeout(scheduleTimer);
      scheduleTimer = undefined;
    }
  }

  function applyScheduledThemeIfAllowed() {
    if (!import.meta.client) {
      return;
    }

    if (readStoredCustomerThemePreference()) {
      return;
    }

    const next = getCustomerScheduleTheme();
    resolved.value = next;
    applyCustomerThemeToDocument(next);
  }

  function scheduleNextThemeFlip() {
    clearScheduleTimer();

    if (!import.meta.client || readStoredCustomerThemePreference()) {
      return;
    }

    scheduleTimer = setTimeout(() => {
      applyScheduledThemeIfAllowed();
      scheduleNextThemeFlip();
    }, getMsUntilNextScheduleThemeFlip());
  }

  function syncFromDocument() {
    if (!import.meta.client) {
      return;
    }

    const stored = readStoredCustomerThemePreference();
    const next = resolveCustomerThemePreference();
    preference.value = stored ?? next;
    resolved.value = next;
    applyCustomerThemeToDocument(next);
    ready.value = true;
    scheduleNextThemeFlip();
  }

  function setTheme(next: CustomerThemePreference) {
    if (!import.meta.client) {
      return;
    }

    preference.value = next;
    resolved.value = next;
    persistCustomerThemePreference(next);
    applyCustomerThemeToDocument(next);
    scheduleNextThemeFlip();
  }

  function toggleTheme() {
    setTheme(resolved.value === 'dark' ? 'light' : 'dark');
  }

  const isDark = computed(() => resolved.value === 'dark');

  onMounted(() => {
    syncFromDocument();
  });

  onUnmounted(() => {
    clearScheduleTimer();
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
