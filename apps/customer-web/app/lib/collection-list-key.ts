type ListKeyPart = string | number | boolean | null | undefined;

function normalizeListKeyPart(part: ListKeyPart): string {
  if (part == null || part === '') {
    return '-';
  }

  return String(part);
}

/** Stable async-data key for paginated / filtered collection lists. */
export function buildCollectionListKey(base: string, parts: ListKeyPart[]): string {
  return `${base}:${parts.map(normalizeListKeyPart).join('|')}`;
}
