const ADMIN_DEFAULT_AFTER_LOGIN = '/';

export function sanitizeAuthRedirectPath(
  value: unknown,
  fallback = ADMIN_DEFAULT_AFTER_LOGIN,
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

export function adminSignInLocation(
  returnPath: string,
  fallback = ADMIN_DEFAULT_AFTER_LOGIN,
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
