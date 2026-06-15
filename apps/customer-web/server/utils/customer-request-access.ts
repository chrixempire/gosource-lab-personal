import type { RequestListResponse, RequestRecord } from '@gosource/api-client';
import { createError } from 'h3';
import type { CustomerSessionSnapshot, CustomerSessionState } from './customer-session-snapshot';

type SessionLike = CustomerSessionSnapshot | CustomerSessionState | null | undefined;

const BUSINESS_OWNER_ROLES = new Set(['super_admin', 'Super Admin', 'super admin']);

export function isBusinessOwnerSnapshot(
  snapshot: SessionLike,
): boolean {
  if (!snapshot) {
    return false;
  }

  if (snapshot.user_type === 'customer') {
    return true;
  }

  return BUSINESS_OWNER_ROLES.has(String(snapshot.data.role ?? '').trim());
}

export function getMemberActorId(snapshot: SessionLike): string {
  if (snapshot?.user_type === 'employee') {
    return snapshot.data.id;
  }

  return '';
}

/** Members only see requests they initiated; super admins see all (per branch / business). */
export function memberCanViewRequest(
  snapshot: SessionLike,
  request: Pick<RequestRecord, 'initiator'>,
): boolean {
  if (isBusinessOwnerSnapshot(snapshot)) {
    return true;
  }

  const actorId = getMemberActorId(snapshot);
  if (!actorId) {
    return false;
  }

  return request.initiator.accountId === actorId;
}

export function scopeRequestListForSnapshot(
  snapshot: SessionLike,
  response: RequestListResponse,
): RequestListResponse {
  if (isBusinessOwnerSnapshot(snapshot)) {
    return response;
  }

  const actorId = getMemberActorId(snapshot);
  const source = Array.isArray(response.data) ? response.data : [];
  const data = actorId
    ? source.filter((request) => request.initiator.accountId === actorId)
    : [];
  const responseMeta = response.meta ?? { page: 1, limit: 10 };
  const limit = Math.max(1, responseMeta.limit || 10);
  const page = Math.max(1, responseMeta.page || 1);
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    ...response,
    data,
    meta: {
      ...responseMeta,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export function assertMemberCanViewRequest(
  snapshot: SessionLike,
  request: RequestRecord,
) {
  if (memberCanViewRequest(snapshot, request)) {
    return;
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'Request not found',
  });
}
