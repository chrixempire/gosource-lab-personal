import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import { parseInventoryTableMeta } from '~/lib/inventory-api';
import { ADMIN_PAGE_ROUTES, inventoryItemPath } from '~/lib/admin-routes';
import type { AdminActivityLogItem } from '~/types/activity-log';
import type { InventoryTableMeta } from '~/types/inventory';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function formatActivityTimestamp(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveActivityObjectLink(module: string, objectId: string | null) {
  if (!objectId) return null;

  const normalizedModule = module.trim().toLowerCase();
  if (normalizedModule.includes('product')) {
    return inventoryItemPath(objectId);
  }
  if (normalizedModule.includes('order')) {
    return `${ADMIN_PAGE_ROUTES.ORDERS}/${objectId}`;
  }

  return null;
}

export function mapLegacyActivityLogRow(row: Record<string, unknown>): AdminActivityLogItem | null {
  const id = String(row._id ?? row.id ?? '');
  if (!id) return null;

  const objectIdRaw = row.objectId;
  const objectId =
    objectIdRaw == null || objectIdRaw === ''
      ? null
      : String(objectIdRaw);

  const module = String(row.module ?? '—');
  const action = String(row.action ?? '—');

  return {
    id,
    description: String(row.description ?? '—'),
    objectId,
    initiator: row.initiator == null ? null : String(row.initiator),
    initiatorType: String(row.initiatorType ?? '—'),
    module,
    action,
    ipAddress: row.ipAddress == null ? null : String(row.ipAddress),
    createdAt: String(row.createdAt ?? ''),
    createdAtLabel: formatActivityTimestamp(row.createdAt ?? row.updatedAt),
    objectLink: resolveActivityObjectLink(module, objectId),
  };
}

export function parseActivityLogListResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 20,
) {
  const body = unwrapLegacyPayload(payload);
  const data = asRecord(body?.data ?? body);
  const rowsRaw = Array.isArray(data?.activitys) ? data.activitys : [];

  const meta: InventoryTableMeta = parseInventoryTableMeta(data, {
    page: fallbackPage,
    limit: fallbackLimit,
  });

  const rows = rowsRaw
    .map((row) => mapLegacyActivityLogRow(asRecord(row) ?? {}))
    .filter((row): row is AdminActivityLogItem => Boolean(row));

  return { rows, meta };
}
