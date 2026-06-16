type ListKeyPart = string | number | boolean | null | undefined;

function normalizeListKeyPart(part: ListKeyPart): string {
  if (part == null || part === '') {
    return '-';
  }

  return String(part);
}

export function buildCollectionListKey(base: string, parts: ListKeyPart[]): string {
  return `${base}:${parts.map(normalizeListKeyPart).join('|')}`;
}

export function buildAdminFetchKey(
  url: string,
  query?: Record<string, unknown> | null,
): string {
  if (!query || Object.keys(query).length === 0) {
    return url;
  }

  const sorted = Object.keys(query)
    .filter((key) => {
      const value = query[key];
      return value !== undefined && value !== null && value !== '';
    })
    .sort()
    .map((key) => [key, query[key]] as const);

  if (sorted.length === 0) {
    return url;
  }

  return `${url}:${JSON.stringify(sorted)}`;
}

/** Cache-bust key when filters change but page stays the same. */
export function buildAdminListFilterSignature(
  url: string,
  query?: Record<string, unknown> | null,
) {
  if (!query || Object.keys(query).length === 0) {
    return url;
  }

  const { page: _page, ...filters } = query;
  return buildAdminFetchKey(url, Object.keys(filters).length > 0 ? filters : null);
}
