import type { CustomerMeResponse, RequestRecord } from '@gosource/api-client';
import { isBusinessOwnerSession } from '~/lib/customer-roles';

export function resolveCurrentActorId(session: CustomerMeResponse | null) {
  if (!session?.data) {
    return '';
  }

  const data = session.data as unknown as Record<string, unknown>;
  if (session.user_type === 'employee' || data.user_type === 'employee') {
    return String(data.id ?? data.employeeId ?? '');
  }

  return String(data.customerId ?? data.id ?? '');
}

export function memberCanViewRequest(
  session: CustomerMeResponse | null,
  request: Pick<RequestRecord, 'initiator'>,
) {
  if (isBusinessOwnerSession(session)) {
    return true;
  }

  const actorId = resolveCurrentActorId(session);
  return Boolean(actorId && request.initiator.accountId === actorId);
}

export function requestCanEditProducts(
  request: RequestRecord | null | undefined,
  session: CustomerMeResponse | null,
) {
  if (!request || request.status !== 'pending') {
    return false;
  }

  if (isBusinessOwnerSession(session)) {
    return true;
  }

  return request.initiator.accountId === resolveCurrentActorId(session);
}

export function requestCanReopenRejected(
  request: RequestRecord | null | undefined,
  session: CustomerMeResponse | null,
) {
  return Boolean(
    request?.status === 'rejected' && isBusinessOwnerSession(session),
  );
}
