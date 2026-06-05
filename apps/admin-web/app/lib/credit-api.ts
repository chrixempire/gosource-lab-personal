import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { parseInventoryTableMeta } from '~/lib/inventory-api';
import {
  creditApplicationTypeLabel,
  creditPaymentMethodLabel,
  creditRepaymentScheduleStatusLabel,
  creditRequestTypeLabel,
  creditRequestStatusLabel,
  creditWorkflowStatusLabel,
} from '~/lib/credit-constants';
import { formatCreditFromKobo } from '~/lib/credit-money';
import type {
  AdminCreditApplicationListItem,
  AdminCreditRequestListItem,
  AdminRepaymentListItem,
  CreditApplicationListFilters,
  CreditChecklistItem,
  CreditAdditionalDoc,
  CreditInternalNote,
  CreditRequestListFilters,
  CreditRequestStats,
  CreditRepaymentScheduleItem,
  CreditRequestType,
  CreditTopPerformerRow,
  CreditWorkflowStatus,
  CustomerOrdersSummary,
  RepaymentScheduleStatus,
  LegacyCreditApplicationRow,
  LegacyCreditRequestRow,
  LegacyRepaymentPaymentRow,
  ParsedCreditList,
  RepaymentListSummary,
  AdminRepaymentScheduleListItem,
  RepaymentSchedulesSummary,
  OverdueRepaymentSummary,
} from '~/types/credit';
import type { InventoryTableMeta } from '~/types/inventory';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function formatCreditDate(value: string | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCreditDateTime(value: string | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function businessDisplayName(business: LegacyCreditApplicationRow['business']) {
  if (!business) return '—';
  if (business.accountType === 'individual') {
    return `${business.firstName ?? ''} ${business.lastName ?? ''}`.trim() || '—';
  }
  return business.businessName ?? '—';
}

export function creditApplicationReferenceLabel(id: string | undefined | null) {
  const value = String(id ?? '').trim();
  return value ? `#${value.slice(-6).toUpperCase()}` : '—';
}

export function creditRequestReferenceLabel(id: string | undefined | null) {
  const value = String(id ?? '').trim();
  return value ? `#${value.slice(-5).toUpperCase()}` : '—';
}

function normalizeCreditDocumentPath(url: URL) {
  const parts = url.pathname.split('/').filter(Boolean);
  const bucketFromHost = url.hostname.split('.')[0];

  if (parts.length >= 2 && bucketFromHost && parts[0] === bucketFromHost) {
    url.pathname = `/${parts.slice(1).join('/')}`;
  }

  return url.toString();
}

/** Fix legacy uploads that duplicated the bucket name in the CDN path. */
export function resolveCreditDocumentUrl(
  raw: string | undefined | null,
  cdnBase?: string | null,
): string | null {
  let value = String(raw ?? '').trim();
  if (!value) {
    return null;
  }

  if (value.startsWith('//')) {
    value = `https:${value}`;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      return normalizeCreditDocumentPath(new URL(value));
    } catch {
      return value;
    }
  }

  const base = String(cdnBase ?? '').trim().replace(/\/$/, '');
  if (!base) {
    return null;
  }

  const key = value.replace(/^\//, '');
  return key ? `${base}/${key}` : null;
}

export function creditDocumentDownloadPath(resolvedUrl: string) {
  return `/api/credit/documents/download?url=${encodeURIComponent(resolvedUrl)}`;
}

function mapApplicationRow(row: LegacyCreditApplicationRow): AdminCreditApplicationListItem {
  const id = String(row._id ?? row.id ?? '');
  const status = (row.status ?? 'pending') as CreditWorkflowStatus;
  const applicationType = (row.applicationType ?? 'initial') as AdminCreditApplicationListItem['applicationType'];

  return {
    id,
    createdAt: row.createdAt ?? '',
    createdAtLabel: formatCreditDate(row.createdAt),
    reference: creditApplicationReferenceLabel(id),
    displayName: businessDisplayName(row.business),
    businessId: String(row.business?._id ?? row.business?.id ?? ''),
    accountType: row.business?.accountType ?? '',
    applicationType,
    applicationTypeLabel: creditApplicationTypeLabel(applicationType),
    status,
    statusLabel: creditWorkflowStatusLabel(status),
  };
}

function mapRequestRow(row: LegacyCreditRequestRow): AdminCreditRequestListItem {
  const id = String(row._id ?? row.id ?? '');
  const status = (row.status ?? 'pending') as CreditWorkflowStatus;
  const requestType = (row.requestType ?? 'initial') as CreditRequestType;

  return {
    id,
    reference: id ? id.slice(-5).toUpperCase() : '—',
    createdAt: row.createdAt ?? '',
    createdAtLabel: formatCreditDate(row.createdAt),
    displayName: businessDisplayName(row.business),
    businessId: String(row.business?._id ?? row.business?.id ?? ''),
    accountType: row.business?.accountType ?? '',
    requestType,
    requestTypeLabel: creditRequestTypeLabel(requestType),
    requestedAmountKobo: row.requestedAmountKobo ?? 0,
    creditLimitKobo: row.creditAccount?.limitKobo ?? 0,
    status,
    statusLabel: creditWorkflowStatusLabel(status),
  };
}

function mapRepaymentRow(row: LegacyRepaymentPaymentRow): AdminRepaymentListItem {
  const id = String(row._id ?? '');
  const status = String(row.status ?? 'PENDING').toUpperCase() as AdminRepaymentListItem['status'];
  const business = row.business;
  const businessId = String(business?._id ?? business?.id ?? '');
  const businessName =
    business?.accountType === 'individual'
      ? `${business?.firstName ?? ''} ${business?.lastName ?? ''}`.trim() || business?.businessName || '—'
      : business?.businessName ?? '—';
  return {
    id,
    businessId,
    referenceCode: row.referenceCode ?? '—',
    businessName,
    paymentDate: row.createdAt ?? '',
    paymentDateLabel: formatCreditDate(row.createdAt),
    amountKobo: row.amountKobo ?? 0,
    paymentMethod: row.paymentMethod ?? '',
    paymentMethodLabel: creditPaymentMethodLabel(row.paymentMethod),
    status,
  };
}

export function parseCreditApplicationsListResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): ParsedCreditList<AdminCreditApplicationListItem> {
  const body = unwrapLegacyPayload(payload);
  const credits = Array.isArray(body?.credits)
    ? (body.credits as LegacyCreditApplicationRow[])
    : [];
  const meta: InventoryTableMeta = parseInventoryTableMeta(body, {
    page: fallbackPage,
    limit: fallbackLimit,
  });

  return {
    rows: credits.map(mapApplicationRow),
    meta,
  };
}

export function parseCreditRequestsListResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): ParsedCreditList<AdminCreditRequestListItem> {
  const body = unwrapLegacyPayload(payload);
  const requests = Array.isArray(body?.requests)
    ? (body.requests as LegacyCreditRequestRow[])
    : [];
  const meta: InventoryTableMeta = parseInventoryTableMeta(body, {
    page: fallbackPage,
    limit: fallbackLimit,
  });

  return {
    rows: requests.map(mapRequestRow),
    meta,
  };
}

export function parseCreditRequestStats(payload: unknown): CreditRequestStats {
  const body = unwrapLegacyPayload(payload);
  return {
    totalRequests: Number(body?.totalRequests) || 0,
    totalPendingRequests: Number(body?.totalPendingRequests) || 0,
    totalApprovedRequests: Number(body?.totalApprovedRequests) || 0,
    totalRejectedRequests: Number(body?.totalRejectedRequests) || 0,
    totalCreditInUseKobo: Number(body?.totalCreditInUse) || 0,
    totalOverdueAccounts: Number(body?.totalOverdueAccounts) || 0,
  };
}

export type CreditAnalyticsSummary = {
  totalCreditDisbursedKobo: number;
  totalCreditOutstandingKobo: number;
  totalPaidRepaymentsKobo: number;
  activeCreditUsers: number;
};

export function parseCreditAnalyticsSummary(payload: unknown): CreditAnalyticsSummary {
  const body = unwrapLegacyPayload(payload);
  return {
    totalCreditDisbursedKobo: Number(body?.totalCreditDisbursedKobo) || 0,
    totalCreditOutstandingKobo: Number(body?.totalCreditOutstandingKobo) || 0,
    totalPaidRepaymentsKobo: Number(body?.totalPaidRepaymentsKobo) || 0,
    activeCreditUsers: Number(body?.activeCreditUsers) || 0,
  };
}

export function parseRepaymentHistoryResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): {
  rows: AdminRepaymentListItem[];
  meta: InventoryTableMeta;
  summary: RepaymentListSummary;
} {
  const body = unwrapLegacyPayload(payload);
  const repayments = Array.isArray(body?.repayments)
    ? (body.repayments as LegacyRepaymentPaymentRow[])
    : [];
  const summaryRecord = asRecord(body?.summary);

  return {
    rows: repayments.map(mapRepaymentRow),
    meta: parseInventoryTableMeta(body, { page: fallbackPage, limit: fallbackLimit }),
    summary: {
      totalCreditDisbursedKobo: Number(summaryRecord?.totalCreditDisbursedKobo) || 0,
      totalPaidRepaymentsKobo: Number(summaryRecord?.totalPaidRepaymentsKobo) || 0,
      outstandingRepaymentsKobo: Number(summaryRecord?.outstandingRepaymentsKobo) || 0,
      overduePaymentsCount: Number(summaryRecord?.overduePaymentsCount) || 0,
      dueThisWeekCount: Number(summaryRecord?.dueThisWeekCount) || 0,
      dueThisMonthCount: Number(summaryRecord?.dueThisMonthCount) || 0,
    },
  };
}

export function parseCreditApplicationDetail(
  payload: unknown,
  cdnBase?: string | null,
): LegacyCreditApplicationRow | null {
  const body = unwrapLegacyPayload(payload) as LegacyCreditApplicationRow | null;
  if (!body) {
    return null;
  }

  const normalizeDocument = (raw: unknown) => {
    const value =
      raw && typeof raw === 'object' && 'url' in raw
        ? String((raw as { url?: unknown }).url ?? '').trim()
        : String(raw ?? '').trim();

    if (!value) {
      return '';
    }

    return resolveCreditDocumentUrl(value, cdnBase) ?? value;
  };

  const additionalDocs = Array.isArray(body.additionalDocs)
    ? body.additionalDocs
        .filter(
          (doc): doc is CreditAdditionalDoc =>
            !!doc && typeof doc === 'object' && typeof (doc as CreditAdditionalDoc).url === 'string',
        )
        .map((doc) => ({
          ...doc,
          key: String(doc.key ?? ''),
          url: normalizeDocument(doc.url),
        }))
    : [];

  return {
    ...body,
    bankStatement: normalizeDocument(body.bankStatement),
    identity: normalizeDocument(body.identity),
    additionalDocs,
  };
}

export function parseCreditRequestDetail(payload: unknown) {
  const body = unwrapLegacyPayload(payload);
  return body as LegacyCreditRequestRow | null;
}

export function filterCreditApplications(
  rows: AdminCreditApplicationListItem[],
  filters: CreditApplicationListFilters,
) {
  const search = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.applicationType.length > 0 && !filters.applicationType.includes(row.applicationType)) {
      return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(row.status)) {
      return false;
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      if (new Date(row.createdAt).getTime() < start) return false;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      if (new Date(row.createdAt).getTime() > end) return false;
    }
    if (search) {
      const haystack = `${row.displayName} ${row.reference}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function filterCreditRequests(
  rows: AdminCreditRequestListItem[],
  filters: CreditRequestListFilters,
) {
  const search = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.requestType.length > 0 && !filters.requestType.includes(row.requestType)) {
      return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(row.status)) {
      return false;
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      if (new Date(row.createdAt).getTime() < start) return false;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      if (new Date(row.createdAt).getTime() > end) return false;
    }
    if (search) {
      const haystack = `${row.displayName} ${row.reference}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function filterRepaymentRows(
  rows: AdminRepaymentListItem[],
  filters: { search: string; paymentMethod: string[]; startDate: string; endDate: string },
) {
  const search = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.paymentMethod.length > 0 && !filters.paymentMethod.includes(row.paymentMethod)) {
      return false;
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      if (new Date(row.paymentDate).getTime() < start) return false;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      if (new Date(row.paymentDate).getTime() > end) return false;
    }
    if (search) {
      const haystack = `${row.businessName} ${row.referenceCode}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function computeApplicationStats(rows: AdminCreditApplicationListItem[], total: number) {
  return {
    all: total,
    pending: rows.filter((row) => row.status === 'pending').length,
    approved: rows.filter((row) => row.status === 'approved').length,
    rejected: rows.filter((row) => row.status === 'rejected').length,
  };
}

export function formatCreditTimeline(
  timeline: Array<{ status?: string; note?: string; changedAt?: string; changedBy?: { firstName?: string; lastName?: string } }> | undefined,
) {
  if (!timeline?.length) return [];
  return timeline.map((entry) => ({
    status: entry.status?.toUpperCase() ?? '',
    title: entry.note ?? '',
    date: formatCreditDateTime(entry.changedAt),
    user: `${entry.changedBy?.firstName ?? ''} ${entry.changedBy?.lastName ?? ''}`.trim(),
  }));
}

export function parseCreditChecklist(payload: unknown): CreditChecklistItem[] {
  const body = unwrapLegacyPayload(payload);
  if (!body) return [];
  if (Array.isArray(body)) {
    return [];
  }
  const documents = body.documents;
  if (!Array.isArray(documents)) return [];
  return documents.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      name: String(row.name ?? ''),
      verified: row.verified === true,
    };
  });
}

export function parseCreditInternalNotes(payload: unknown): CreditInternalNote[] {
  const body = unwrapLegacyPayload(payload);
  const notes = Array.isArray(body?.notes) ? body.notes : [];
  return notes.map((item) => {
    const row = item as Record<string, unknown>;
    const createdBy = row.createdBy as Record<string, unknown> | undefined;
    const id = String(row._id ?? row.id ?? '');
    return {
      id,
      note: String(row.note ?? ''),
      noteType: String(row.noteType ?? ''),
      createdAt: String(row.createdAt ?? ''),
      authorName: `${createdBy?.firstName ?? ''} ${createdBy?.lastName ?? ''}`.trim() || 'Admin',
    };
  });
}

export function parseCreditTopPerformers(payload: unknown): CreditTopPerformerRow[] {
  const body = unwrapLegacyPayload(payload);
  const rows = Array.isArray(body?.performers) ? body.performers : [];
  return rows.map((item) => {
    const row = item as Record<string, unknown>;
    const accountType = String(row.accountType ?? 'business');
    const displayName =
      String(row.displayName ?? '').trim() ||
      (accountType === 'individual'
        ? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim()
        : String(row.businessName ?? ''));
    return {
      businessId: String(row.businessId ?? ''),
      displayName: displayName || '—',
      accountType,
      creditLimitKobo: Number(row.creditLimitKobo) || 0,
      creditUsedKobo: Number(row.creditUsedKobo) || 0,
      repaymentScore: Number(row.repaymentScore) || 0,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    };
  });
}

export function formatCreditRevenueRange(revenueRange: string | undefined) {
  if (!revenueRange?.trim()) return '—';
  const parts = revenueRange.split('-').map((part) => Number(part.trim()));
  if (parts.length === 2 && parts.every((value) => Number.isFinite(value))) {
    return `${formatDashboardCurrency(parts[0])} – ${formatDashboardCurrency(parts[1])}`;
  }
  return revenueRange;
}

export function parseCustomerOrdersSummary(payload: unknown): CustomerOrdersSummary {
  const body = unwrapLegacyPayload(payload);
  const lastOrder = body?.lastOrder;
  return {
    totalOrders: Number(body?.totalOrders) || 0,
    avgMonthlySpend: Number(body?.avgMonthlySpend) || 0,
    totalSpent: Number(body?.totalSpent) || 0,
    lastOrder:
      typeof lastOrder === 'string'
        ? lastOrder
        : lastOrder instanceof Date
          ? lastOrder.toISOString()
          : lastOrder
            ? String(lastOrder)
            : null,
  };
}

function mapRepaymentScheduleListRow(row: Record<string, unknown>): AdminRepaymentScheduleListItem {
  const id = String(row._id ?? row.id ?? '');
  const status = String(row.status ?? 'PENDING') as RepaymentScheduleStatus;
  const business = asRecord(row.business);
  const businessId = String(business?._id ?? business?.id ?? '');
  const creditRequest = asRecord(row.creditRequest);
  const creditRequestId = String(creditRequest?._id ?? creditRequest?.id ?? row.creditRequest ?? '');
  const displayName =
    typeof business?.businessName === 'string' && business.businessName.trim()
      ? business.businessName
      : '—';
  const daysOverdue = Number(row.daysOverdue);
  const remainingKobo = Number(row.remainingAmountKobo) || 0;
  const totalKobo = Number(row.totalAmountKobo) || 0;

  return {
    id,
    businessId,
    creditRequestId,
    displayName,
    installmentNumber: Number(row.installmentNumber) || 0,
    dueDateLabel: formatCreditDate(String(row.dueDate ?? '')),
    amountDueLabel: formatCreditFromKobo(totalKobo),
    remainingAmountLabel: formatCreditFromKobo(remainingKobo),
    status,
    statusLabel: creditRepaymentScheduleStatusLabel(status),
    daysOverdue: Number.isFinite(daysOverdue) && daysOverdue > 0 ? daysOverdue : null,
    referenceLabel: id ? id.slice(-6).toUpperCase() : '—',
  };
}

export function parseRepaymentSchedulesListResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): {
  rows: AdminRepaymentScheduleListItem[];
  meta: InventoryTableMeta;
  summary: RepaymentSchedulesSummary;
} {
  const body = unwrapLegacyPayload(payload);
  const repayments = Array.isArray(body?.repayments)
    ? (body.repayments as Array<Record<string, unknown>>)
    : [];
  const summaryRecord = asRecord(body?.summary);

  return {
    rows: repayments.map(mapRepaymentScheduleListRow),
    meta: parseInventoryTableMeta(body, { page: fallbackPage, limit: fallbackLimit }),
    summary: {
      totalRepayments: Number(summaryRecord?.totalRepayments) || 0,
      totalScheduledAmountKobo: Number(summaryRecord?.totalScheduledAmount) || 0,
      totalPaidAmountKobo: Number(summaryRecord?.totalPaidAmount) || 0,
      totalRemainingAmountKobo: Number(summaryRecord?.totalRemainingAmount) || 0,
      totalOverdueAmountKobo: Number(summaryRecord?.totalOverdueAmount) || 0,
      overdueCount: Number(summaryRecord?.overdueCount) || 0,
      collectionRate: Number(summaryRecord?.collectionRate) || 0,
    },
  };
}

export function parseOverdueRepaymentSchedulesResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): {
  rows: AdminRepaymentScheduleListItem[];
  meta: InventoryTableMeta;
  summary: OverdueRepaymentSummary;
} {
  const body = unwrapLegacyPayload(payload);
  const overdueRepayments = Array.isArray(body?.overdueRepayments)
    ? (body.overdueRepayments as Array<Record<string, unknown>>)
    : [];
  const summaryRecord = asRecord(body?.summary);

  return {
    rows: overdueRepayments.map(mapRepaymentScheduleListRow),
    meta: parseInventoryTableMeta(body, { page: fallbackPage, limit: fallbackLimit }),
    summary: {
      totalOverdueAmountKobo: Number(summaryRecord?.totalOverdueAmount) || 0,
      totalOverdueCount: Number(summaryRecord?.totalOverdueCount) || 0,
      averageDaysOverdue: Number(summaryRecord?.averageDaysOverdue) || 0,
    },
  };
}

export function parseCreditRepaymentSchedule(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 25,
): { rows: CreditRepaymentScheduleItem[]; meta: InventoryTableMeta } {
  const body = unwrapLegacyPayload(payload);
  const schedule = Array.isArray(body?.schedule) ? body.schedule : [];
  return {
    rows: schedule.map((item) => {
      const row = item as Record<string, unknown>;
      const id = String(row._id ?? row.id ?? '');
      const status = String(row.status ?? 'PENDING') as RepaymentScheduleStatus;
      const overdueKobo = Number(row.overdueChargesKobo) || 0;
      return {
        id,
        installmentNumber: Number(row.installmentNumber) || 0,
        dueDateLabel: formatCreditDate(String(row.dueDate ?? '')),
        amountDueLabel: formatCreditFromKobo(Number(row.totalAmountKobo) || 0),
        overdueChargesLabel: overdueKobo > 0 ? formatCreditFromKobo(overdueKobo) : null,
        status,
        statusLabel: creditRepaymentScheduleStatusLabel(status),
        referenceLabel: id ? id.slice(-6).toUpperCase() : '—',
      };
    }),
    meta: parseInventoryTableMeta(body, { page: fallbackPage, limit: fallbackLimit }),
  };
}

export function parseCustomerCreditSummary(payload: unknown) {
  const body = unwrapLegacyPayload(payload);
  const account = asRecord(body?.creditAccount);
  return {
    totalCreditCollectedKobo: Number(body?.totalCreditCollected) || 0,
    totalApprovedRequests: Number(body?.totalApprovedRequests) || 0,
    totalRepaidKobo: Number(account?.totalPaymentsKobo) || 0,
    creditLimitKobo: Number(account?.limitKobo) || 0,
    usedCreditKobo: Number(account?.outstandingKobo) || 0,
    defaultedCount: Number(account?.defaultedCounts) || 0,
    rejectedCount: Number(account?.creditRequestRejectCounts) || 0,
  };
}

export type CustomerCreditHistoryRow = {
  id: string;
  reference: string;
  createdAtLabel: string;
  requestType: string;
  requestedAmountKobo: number;
  approvedAmountKobo: number;
  repaidAmountKobo: number;
  status: string;
  statusLabel: string;
};

export function parseCustomerCreditHistory(payload: unknown, page = 1, limit = 10) {
  const body = unwrapLegacyPayload(payload);
  const rows = Array.isArray(body?.creditRequests)
    ? (body.creditRequests as Array<Record<string, unknown>>)
    : [];
  const pagination = asRecord(body?.pagination);
  const total = Number(pagination?.total) || rows.length;
  const pageNum = Number(pagination?.page) || page;
  const pageLimit = Number(pagination?.limit) || limit;
  const totalPages =
    Number(pagination?.totalPages) || Math.max(1, Math.ceil(total / pageLimit) || 1);

  return {
    rows: rows.map((row) => {
      const id = String(row._id ?? '');
      const status = String(row.status ?? 'pending');
      return {
        id,
        reference: id ? `#${id.slice(-6).toUpperCase()}` : '—',
        createdAtLabel: formatCreditDateTime(String(row.createdAt ?? '')),
        requestType: creditRequestTypeLabel(String(row.requestType ?? '')),
        requestedAmountKobo: Number(row.requestedAmountKobo) || 0,
        approvedAmountKobo: Number(row.approvedAmountKobo) || 0,
        repaidAmountKobo:
          Number(row.totalRepaymentAmountKobo) || Number(row.totalRepaidAmountKobo) || 0,
        status,
        statusLabel: creditRequestStatusLabel(status),
      } satisfies CustomerCreditHistoryRow;
    }),
    meta: {
      page: pageNum,
      limit: pageLimit,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    } satisfies InventoryTableMeta,
  };
}

export { formatCreditFromKobo, formatCreditDate, formatCreditDateTime, businessDisplayName };
