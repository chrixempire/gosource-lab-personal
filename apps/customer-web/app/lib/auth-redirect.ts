const CUSTOMER_DEFAULT_AFTER_LOGIN = '/market';

/** Only allow same-app relative paths (blocks open redirects). */
export function sanitizeAuthRedirectPath(
  value: unknown,
  fallback = CUSTOMER_DEFAULT_AFTER_LOGIN,
): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const path = value.trim();

  if (!path.startsWith('/') || path.startsWith('//')) {
    return fallback;
  }

  if (path.startsWith('/auth')) {
    return fallback;
  }

  return path;
}

export function customerSignInLocation(
  returnPath: string,
  fallback = CUSTOMER_DEFAULT_AFTER_LOGIN,
) {
  const redirect = sanitizeAuthRedirectPath(returnPath, fallback);

  if (redirect === fallback && returnPath.startsWith('/auth')) {
    return { path: '/auth/sign-in' as const };
  }

  return {
    path: '/auth/sign-in' as const,
    query: { redirect },
  };
}

export function customerDefaultAfterLogin() {
  return CUSTOMER_DEFAULT_AFTER_LOGIN;
}
