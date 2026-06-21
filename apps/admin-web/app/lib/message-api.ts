import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import type {
  AdminMessageListMeta,
  AdminMessageRow,
  AdminMessageStatus,
  AdminMessageType,
} from '~/types/messages';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function findRecordWithKey(
  payload: unknown,
  key: string,
  depth = 0,
): Record<string, unknown> | null {
  const record = asRecord(payload);
  if (!record || depth > 4) return null;
  if (key in record) return record;

  for (const nestedKey of ['data', 'result', 'payload']) {
    const nested = findRecordWithKey(record[nestedKey], key, depth + 1);
    if (nested) return nested;
  }
  return null;
}

function mapMessage(value: unknown): AdminMessageRow | null {
  const row = asRecord(value);
  if (!row) return null;
  const id = String(row._id ?? row.id ?? '');
  if (!id) return null;

  return {
    id,
    message: String(row.message ?? ''),
    subject: typeof row.subject === 'string' ? row.subject : undefined,
    type: String(row.type ?? 'alert') as AdminMessageType,
    status: String(row.status ?? 'inactive') as AdminMessageStatus,
    theme: typeof row.theme === 'string' ? row.theme : undefined,
    startDate: typeof row.startDate === 'string' ? row.startDate : undefined,
    endDate: typeof row.endDate === 'string' ? row.endDate : undefined,
    createdAt: String(row.createdAt ?? ''),
    recipientCount: Number(row.recipientCount) || 0,
    deliveredCount: Number(row.deliveredCount) || 0,
    failedCount: Number(row.failedCount) || 0,
    resendCount: Number(row.resendCount) || 0,
  };
}

export function parseMessagesResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
) {
  const body =
    findRecordWithKey(payload, 'messages') ??
    unwrapLegacyPayload(payload) ??
    asRecord(payload);
  const rawMessages = Array.isArray(body?.messages)
    ? body.messages
    : Array.isArray(body?.data)
      ? body.data
      : [];
  const rows = rawMessages
    .map(mapMessage)
    .filter((row): row is AdminMessageRow => Boolean(row));
  const rawMeta = asRecord(body?.meta);
  const page = Number(rawMeta?.page) || fallbackPage;
  const limit = Number(rawMeta?.limit) || fallbackLimit;
  const total = Number(rawMeta?.total ?? rawMeta?.totalDocuments) || rows.length;
  const totalPages = Math.max(
    1,
    Number(rawMeta?.totalPages) || Math.ceil(total / limit) || 1,
  );

  const meta: AdminMessageListMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: rawMeta?.hasNextPage === true || page < totalPages,
    hasPrev: rawMeta?.hasPrevPage === true || page > 1,
  };

  return { rows, meta };
}

export function parseMessageStats(payload: unknown) {
  const body =
    findRecordWithKey(payload, 'totalMessages') ??
    unwrapLegacyPayload(payload) ??
    asRecord(payload);
  return {
    total: Number(body?.totalMessages) || 0,
    alerts: Number(body?.alertMessages) || 0,
    emails: Number(body?.emailMessages) || 0,
  };
}

export function parseSingleMessage(payload: unknown) {
  let candidate: unknown = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    const record = asRecord(candidate);
    if (!record || '_id' in record || 'id' in record) break;
    const nested = record.data ?? record.result ?? record.payload;
    if (nested === undefined) break;
    candidate = nested;
  }
  return mapMessage(candidate);
}
