import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import type { InventoryTableMeta } from '~/types/inventory';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function parseInventoryTableMeta(
  body: Record<string, unknown> | null,
  fallback: { page: number; limit: number },
): InventoryTableMeta {
  const meta = asRecord(body?.meta);

  if (meta) {
    const total = Number(meta.totalDocuments) || Number(meta.total) || 0;
    const limit = Number(meta.limit) || fallback.limit;
    const page = Number(meta.page) || fallback.page;
    const totalPages = Math.max(1, Number(meta.totalPages) || Math.ceil(total / limit) || 1);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: meta.hasNext === true || page < totalPages,
      hasPrev: meta.hasPrev === true || page > 1,
    };
  }

  const total = Number(body?.totalDocuments) || 0;
  const limit = Number(body?.limit) || fallback.limit;
  const page = Number(body?.page) || fallback.page;
  const totalPages = Math.max(1, Number(body?.totalPages) || Math.ceil(total / limit) || 1);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function unwrapInventoryData(payload: unknown) {
  return unwrapLegacyPayload(payload) ?? asRecord(payload);
}
