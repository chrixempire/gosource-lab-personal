import type { RequestActorRecord, RequestRecord } from '@gosource/api-client';
import type { RequestDetailsView } from '~/components/requests/RequestDetailsPanel.vue';
import type { RequestListItem } from '~/components/requests/RequestCards.vue';

export function resolveRequestRecordId(
  record: { id?: string; _id?: string } | null | undefined,
): string | undefined {
  const raw = record?.id ?? record?._id;
  return raw ? String(raw) : undefined;
}

export function formatRequestCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatRequestDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getRequestStatusVariant(status: RequestRecord['status']) {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected' || status === 'cancelled') return 'negative' as const;
  return 'warning' as const;
}

function getPaymentStatusVariant(status: RequestRecord['paymentStatus']) {
  return status === 'paid' ? ('success' as const) : ('warning' as const);
}

function formatActorRole(role: string) {
  const normalized = role.trim().toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'super_admin') {
    return 'Super Admin';
  }
  if (normalized === 'employee') {
    return 'Employee';
  }

  return role
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatActorName(actor: RequestActorRecord) {
  const name = [actor.firstName ?? '', actor.lastName ?? '']
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || actor.email;
}

export function buildRequestDetailsView(request: RequestRecord): RequestDetailsView {
  const products = Array.isArray(request.products) ? request.products : [];
  const initiatorName = formatActorName(request.initiator);
  const approver = request.approver;
  const approvedAtSource = request.approvedAt ?? request.updatedAt;
  const showApprovedAt =
    request.status === 'approved' || request.status === 'rejected';

  return {
    id: request.id,
    reference: request.reference,
    status: request.status,
    branchName: request.branchName,
    branchCode: request.branchCode,
    branchOrderLabel: request.branchCode ?? request.branchName,
    statusLabel: request.status.charAt(0).toUpperCase() + request.status.slice(1),
    statusVariant: getRequestStatusVariant(request.status),
    paymentStatusLabel:
      request.paymentStatus.charAt(0).toUpperCase() + request.paymentStatus.slice(1),
    paymentStatusVariant: getPaymentStatusVariant(request.paymentStatus),
    paymentMethod: request.paymentMethod,
    initiatorName,
    initiatorEmail: request.initiator.email,
    initiatorPhone: request.initiator.phoneNumber ?? request.phoneNumber,
    initiatorRole: formatActorRole(request.initiator.role),
    phoneNumber: request.phoneNumber,
    createdLabel: formatRequestDateTime(request.createdAt),
    approverName: approver ? formatActorName(approver) : null,
    approverEmail: approver?.email ?? null,
    approverPhone: approver?.phoneNumber ?? null,
    approverRole: approver ? formatActorRole(approver.role) : null,
    approvedAtLabel: showApprovedAt ? formatRequestDateTime(approvedAtSource) : null,
    addressLine: `${request.address.streetAddress}, ${request.address.lga}, ${request.address.state}`,
    addressDirections: request.address.directions ?? null,
    products,
    subtotal: request.subtotal,
    deliveryFee: request.deliveryFee,
    serviceCharge: request.serviceCharge,
    discount: request.discount,
    totalPrice: request.totalPrice,
    rejectedReasons: request.rejectedReasons,
  };
}

export function mapRequestToListItem(request: RequestRecord): RequestListItem {
  const products = Array.isArray(request.products) ? request.products : [];
  const initiatorName = formatActorName(request.initiator);

  return {
    id: request.id,
    branchId: request.branchId,
    reference: request.reference,
    initiatorName,
    initiatorEmail: request.initiator.email,
    branchName: request.branchName,
    status: request.status,
    initiatorAccountId: request.initiator.accountId,
    statusLabel: request.status.charAt(0).toUpperCase() + request.status.slice(1),
    paymentLabel: request.paymentStatus === 'paid' ? 'Paid' : 'Pending',
    statusVariant: getRequestStatusVariant(request.status),
    createdLabel: formatRequestDate(request.createdAt),
    amountLabel: formatRequestCurrency(request.totalPrice),
    itemsCountLabel: `${products.length} ${products.length === 1 ? 'item' : 'items'}`,
    initials:
      initiatorName
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase() || 'RQ',
  };
}

export function requestHasPendingActions(status: RequestRecord['status']) {
  return status === 'pending';
}

/** Approver card only after a decision (approved / rejected). */
export function requestShowsApproverDetails(status: RequestRecord['status']) {
  return status === 'approved' || status === 'rejected';
}
