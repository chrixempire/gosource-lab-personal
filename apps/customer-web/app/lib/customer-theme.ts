export const CUSTOMER_THEME_STORAGE_KEY = 'gosource.customer.theme';
export const CUSTOMER_THEME_SWITCHING_CLASS = 'customer-theme-switching';

export type CustomerThemePreference = 'light' | 'dark';
export type CustomerResolvedTheme = CustomerThemePreference;

export function isCustomerThemePreference(value: unknown): value is CustomerThemePreference {
  return value === 'light' || value === 'dark';
}

export function readStoredCustomerThemePreference(): CustomerThemePreference | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(CUSTOMER_THEME_STORAGE_KEY);
    return isCustomerThemePreference(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Follow the operating system's / phone's colour scheme (prefers-color-scheme). */
export function resolveSystemTheme(): CustomerThemePreference {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveCustomerThemePreference(): CustomerThemePreference {
  const stored = readStoredCustomerThemePreference();
  if (stored) {
    return stored;
  }

  return resolveSystemTheme();
}

export function applyCustomerThemeToDocument(theme: CustomerResolvedTheme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.add(CUSTOMER_THEME_SWITCHING_CLASS);
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;

  // Snap all surfaces at once — layout shells use transition-colors which otherwise
  // animate sidebar, header, and main on different timings when .dark toggles.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove(CUSTOMER_THEME_SWITCHING_CLASS);
    });
  });
}

export function persistCustomerThemePreference(theme: CustomerThemePreference) {
  try {
    localStorage.setItem(CUSTOMER_THEME_STORAGE_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
}

/** Forget the explicit choice so the app follows the OS setting again. */
export function clearStoredCustomerThemePreference() {
  try {
    localStorage.removeItem(CUSTOMER_THEME_STORAGE_KEY);
  } catch {
    // ignore quota / private mode
  }
}

/** Tri-state control value: an explicit theme, or "system" (follow the OS). */
export type CustomerThemeMode = CustomerThemePreference | 'system';

/** Inline bootstrap for nuxt head — must stay in sync with resolveCustomerThemePreference. */
export const CUSTOMER_THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(CUSTOMER_THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var systemDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var d=s==='dark'||(s!=='light'&&systemDark);var e=document.documentElement;if(d){e.classList.add('dark');e.style.colorScheme='dark';}else{e.classList.remove('dark');e.style.colorScheme='light';}}catch(e){}})();`;
