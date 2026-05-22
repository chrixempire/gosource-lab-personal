export function readLegacyQueryValue(query: Record<string, unknown>, key: string) {
  const value = query[key];
  if (Array.isArray(value)) {
    return value.filter((entry) => entry != null && entry !== '').map(String);
  }
  if (value == null || value === '') {
    return undefined;
  }
  return String(value);
}

export function readLegacyQueryArray(query: Record<string, unknown>, key: string) {
  const value = query[key];
  if (value == null || value === '') {
    return undefined;
  }

  if (typeof value === 'string' && value.includes(',')) {
    const split = value.split(',').filter(Boolean);
    return split.length > 0 ? split : undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  const normalized = values
    .filter((entry) => entry != null && entry !== '')
    .map((entry) => String(entry));

  return normalized.length > 0 ? normalized : undefined;
}
