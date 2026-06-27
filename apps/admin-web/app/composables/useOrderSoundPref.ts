const STORAGE_KEY = 'admin-order-sound-enabled';
let hydrated = false;

/**
 * Whether the new-order sound is enabled, persisted across reloads. Shared
 * app-wide so the header toggle and `useOrderSound` stay in sync. Defaults on.
 */
export function useOrderSoundPref() {
  const enabled = useState<boolean>('admin-order-sound-enabled', () => true);

  if (import.meta.client && !hydrated) {
    hydrated = true;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      enabled.value = stored === '1';
    }
  }

  function setEnabled(value: boolean) {
    enabled.value = value;
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    }
  }

  return {
    enabled,
    setEnabled,
    toggle: () => setEnabled(!enabled.value),
  };
}
