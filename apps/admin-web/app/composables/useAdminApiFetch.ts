type MaybeStatusError = {
  status?: number;
  statusCode?: number;
  response?: { status?: number };
};

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = error as MaybeStatusError;
  return Number(candidate.statusCode ?? candidate.status ?? candidate.response?.status ?? 0) || null;
}

/**
 * Run admin API calls with one silent auth refresh retry on 401.
 * This avoids noisy toasts for transient token-expiry failures.
 */
export async function adminApiFetch<T>(url: string, options?: Parameters<typeof $fetch<T>>[1]) {
  try {
    return await $fetch<T>(url, options);
  } catch (error) {
    if (getErrorStatus(error) !== 401) {
      throw error;
    }

    try {
      await $fetch('/api/auth/session/me');
    } catch {
      throw error;
    }

    return await $fetch<T>(url, options);
  }
}
