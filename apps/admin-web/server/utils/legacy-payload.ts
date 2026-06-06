export function unwrapLegacyPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const data = root.data;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return root;
}
