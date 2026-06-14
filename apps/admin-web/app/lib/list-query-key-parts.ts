type ListKeyPart = string | number | boolean | null | undefined;

/**
 * Build stable list cache key parts with page first so filter-only changes can
 * invalidate cached pages without treating page changes as filter changes.
 */
export function listQueryToKeyParts(query: Record<string, unknown>): ListKeyPart[] {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const parts: ListKeyPart[] = [page, limit];

  const restKeys = Object.keys(query)
    .filter((key) => key !== 'page' && key !== 'limit')
    .sort();

  for (const key of restKeys) {
    const value = query[key];
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      const normalized = value.filter((entry) => entry != null && entry !== '').map(String);
      if (normalized.length > 0) {
        parts.push(`${key}:${normalized.join(',')}`);
      }
      continue;
    }

    parts.push(`${key}:${String(value)}`);
  }

  return parts;
}
