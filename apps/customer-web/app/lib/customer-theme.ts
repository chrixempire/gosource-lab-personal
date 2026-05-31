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

export function resolveCustomerThemePreference(): CustomerThemePreference {
  const stored = readStoredCustomerThemePreference();
  if (stored) {
    return stored;
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
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

/** Inline bootstrap for nuxt head — must stay in sync with resolveCustomerThemePreference. */
export const CUSTOMER_THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(CUSTOMER_THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;if(d){e.classList.add('dark');e.style.colorScheme='dark';}else{e.classList.remove('dark');e.style.colorScheme='light';}}catch(e){}})();`;
