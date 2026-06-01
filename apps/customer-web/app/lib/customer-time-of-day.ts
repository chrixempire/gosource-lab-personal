import type { CustomerThemePreference } from './customer-theme';

/** Dark mode from 7:00 p.m. until before 7:00 a.m. (local time). */
export function isCustomerScheduleDarkMode(date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 19 || hour < 7;
}

export function getCustomerScheduleTheme(date = new Date()): CustomerThemePreference {
  return isCustomerScheduleDarkMode(date) ? 'dark' : 'light';
}

export function getCustomerTimeGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

/** Milliseconds until the next 7:00 a.m. or 7:00 p.m. theme boundary. */
export function getMsUntilNextScheduleThemeFlip(date = new Date()): number {
  const next = new Date(date);
  const hour = date.getHours();

  if (hour >= 7 && hour < 19) {
    next.setHours(19, 0, 0, 0);
  } else if (hour >= 19) {
    next.setDate(next.getDate() + 1);
    next.setHours(7, 0, 0, 0);
  } else {
    next.setHours(7, 0, 0, 0);
  }

  return Math.max(0, next.getTime() - date.getTime());
}
