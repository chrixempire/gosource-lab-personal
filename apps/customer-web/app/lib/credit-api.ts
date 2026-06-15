import type {
  CreditApplicationType,
  CreditListMeta,
  CreditRequestType,
  CreditWorkflowStatus,
  CustomerCreditAccount,
  CustomerCreditApplication,
  CustomerCreditApplicationsResult,
  CustomerCreditRepayment,
  CustomerCreditRepaymentHistoryResult,
  CustomerCreditRequest,
  CustomerCreditRepaymentSchedule,
  CustomerCreditRequestDetail,
  CustomerCreditRequestsResult,
  CustomerUpcomingCreditPayment,
} from '~/types/credit';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/** Legacy customer API returns `{ status, message, data }` for most credit routes. */
export function unwrapLegacyPayload(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }

  if ('data' in root && (root.data === null || root.data === undefined)) {
    return null;
  }

  const data = root.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return root;
}

function parseListMeta(meta: unknown, fallbackPage = 1, fallbackLimit = 10): CreditListMeta {
  const row = asRecord(meta);
  return {
    page: Number(row?.page) > 0 ? Number(row?.page) : fallbackPage,
    limit: Number(row?.limit) > 0 ? Number(row?.limit) : fallbackLimit,
    total: Number(row?.total) >= 0 ? Number(row?.total) : 0,
  };
}

function normalizeWorkflowStatus(raw: unknown): CreditWorkflowStatus {
  const normalized = String(raw ?? 'pending').trim().toLowerCase();
  const allowed: CreditWorkflowStatus[] = [
    'pending',
    'approved',
    'rejected',
    'completed',
    'cancelled',
    'defaulted',
  ];

  return allowed.includes(normalized as CreditWorkflowStatus)
    ? (normalized as CreditWorkflowStatus)
    : 'pending';
}

function mapApplication(row: Record<string, unknown>): CustomerCreditApplication {
  const id = String(row._id ?? row.id ?? '');
  return {
    id,
    createdAt: String(row.createdAt ?? ''),
    status: normalizeWorkflowStatus(row.status),
    applicationType: (row.applicationType ?? 'initial') as CreditApplicationType,
    requestedAmountKobo: Number(row.requestedAmountKobo) || 0,
    approvedAmountKobo: Number(row.approvedAmountKobo) || 0,
    rejectionReason: String(row.rejectionReason ?? ''),
  };
}

export function parseCreditApplications(
  payload: unknown,
  page = 1,
  limit = 200,
): CustomerCreditApplicationsResult {
  const body = unwrapLegacyPayload(payload);
  const credits = Array.isArray(body?.credits)
    ? body.credits
    : Array.isArray(body?.data)
      ? body.data
      : [];

  return {
    items: credits
      .map((item) => mapApplication(asRecord(item) ?? {}))
      .filter((item) => item.id.length > 0),
    meta: parseListMeta(body?.meta, page, limit),
  };
}

export function parseCreditApplicationDetail(payload: unknown): CustomerCreditApplication | null {
  const body = unwrapLegacyPayload(payload);
  if (!body) {
    return null;
  }

  const mapped = mapApplication(body);
  return mapped.id ? mapped : null;
}

export function parseCreditAccount(payload: unknown): CustomerCreditAccount | null {
  const body = unwrapLegacyPayload(payload);
  if (!body) {
    return null;
  }

  const id = String(body._id ?? body.id ?? '');
  if (!id) {
    return null;
  }

  return {
    id,
    limitKobo: Number(body.limitKobo) || 0,
    outstandingKobo: Number(body.outstandingKobo) || 0,
    spendableAmountKobo: Number(body.spendableAmountKobo) || 0,
    availableKobo: Number(body.availableKobo) || 0,
    totalPaymentsKobo: Number(body.totalPaymentsKobo) || 0,
    totalOverdueKobo: Number(body.totalOverdueKobo) || 0,
    creditUtilization: Number(body.creditUtilization) || 0,
    status: String(body.status ?? ''),
  };
}

function mapRequest(row: Record<string, unknown>): CustomerCreditRequest {
  const id = String(row._id ?? row.id ?? '');
  return {
    id,
    createdAt: String(row.createdAt ?? ''),
    status: (row.status ?? 'pending') as CreditWorkflowStatus,
    requestType: (row.requestType ?? 'initial') as CreditRequestType,
    requestedAmountKobo: Number(row.requestedAmountKobo) || 0,
    approvedAmountKobo: Number(row.approvedAmountKobo) || 0,
    repaidAmountKobo: Number(row.repaidAmountKobo) || 0,
    reference: id ? id.slice(-5).toUpperCase() : '',
    requestedRepaymentFrequency: row.requestedRepaymentFrequency
      ? String(row.requestedRepaymentFrequency)
      : undefined,
    requestedRepaymentDuration:
      row.requestedRepaymentDuration != null
        ? Number(row.requestedRepaymentDuration)
        : undefined,
  };
}

export function parseCreditRequests(
  payload: unknown,
  page = 1,
  limit = 10,
): CustomerCreditRequestsResult {
  const body = unwrapLegacyPayload(payload);
  const requests = Array.isArray(body?.requests) ? body.requests : [];

  return {
    items: requests
      .map((item) => mapRequest(asRecord(item) ?? {}))
      .filter((item) => item.id.length > 0),
    meta: parseListMeta(body?.meta, page, limit),
  };
}

export function parseCreditRequestDetail(payload: unknown): CustomerCreditRequestDetail | null {
  const body = unwrapLegacyPayload(payload);
  if (!body) {
    return null;
  }

  const id = String(body._id ?? body.id ?? '');
  if (!id) {
    return null;
  }

  const schedules: CustomerCreditRepaymentSchedule[] = Array.isArray(body.schedules)
    ? body.schedules.map((item) => {
        const row = asRecord(item) ?? {};
        return {
          id: String(row._id ?? row.id ?? ''),
          installmentNumber: Number(row.installmentNumber) || 0,
          dueDate: String(row.dueDate ?? ''),
          principalAmountKobo: Number(row.principalAmountKobo) || 0,
          interestAmountKobo: Number(row.interestAmountKobo) || 0,
          totalAmountKobo: Number(row.totalAmountKobo) || 0,
          paidAmountKobo: Number(row.paidAmountKobo) || 0,
          remainingAmountKobo: Number(row.remainingAmountKobo ?? row.amountDueKobo) || 0,
          status: String(row.status ?? ''),
        };
      })
    : [];

  return {
    id,
    createdAt: String(body.createdAt ?? ''),
    status: (body.status ?? 'pending') as CreditWorkflowStatus,
    requestType: (body.requestType ?? 'initial') as CreditRequestType,
    requestedAmountKobo: Number(body.requestedAmountKobo) || 0,
    approvedAmountKobo: Number(body.approvedAmountKobo) || 0,
    repaidAmountKobo: Number(body.repaidAmountKobo) || 0,
    reference: String(body.reference ?? (id ? id.slice(-5).toUpperCase() : '')),
    rejectionReason: String(body.rejectionReason ?? ''),
    requestedRepaymentFrequency: body.requestedRepaymentFrequency
      ? String(body.requestedRepaymentFrequency)
      : undefined,
    requestedRepaymentDuration:
      body.requestedRepaymentDuration != null
        ? Number(body.requestedRepaymentDuration)
        : undefined,
    repaymentFrequency: body.repaymentFrequency ? String(body.repaymentFrequency) : undefined,
    repaymentDuration:
      body.repaymentDuration != null ? Number(body.repaymentDuration) : undefined,
    interestRate: body.interestRate != null ? Number(body.interestRate) : undefined,
    gracePeriodDays: body.gracePeriodDays != null ? Number(body.gracePeriodDays) : undefined,
    overdueChargeRate:
      body.overdueChargeRate != null ? Number(body.overdueChargeRate) : undefined,
    totalInterestAmountKobo: Number(body.totalInterestAmountKobo) || 0,
    totalRepaymentAmountKobo: Number(body.totalRepaymentAmountKobo) || 0,
    dueDate: body.dueDate ? String(body.dueDate) : undefined,
    approvedDate: body.approvedDate ? String(body.approvedDate) : undefined,
    schedules,
  };
}

function mapRepayment(row: Record<string, unknown>): CustomerCreditRepayment {
  const id = String(row._id ?? row.id ?? '');
  return {
    id,
    createdAt: String(row.createdAt ?? ''),
    referenceCode: String(row.referenceCode ?? row.reference ?? '—'),
    paymentAmountKobo: Number(row.paymentAmountKobo ?? row.amountKobo) || 0,
    paymentMethod: String(row.paymentMethod ?? ''),
    status: String(row.status ?? ''),
  };
}

export function parseCreditRepaymentHistory(
  payload: unknown,
  page = 1,
  limit = 10,
): CustomerCreditRepaymentHistoryResult {
  const body = unwrapLegacyPayload(payload);
  const repayments = Array.isArray(body?.repayments) ? body.repayments : [];

  return {
    items: repayments
      .map((item) => mapRepayment(asRecord(item) ?? {}))
      .filter((item) => item.id.length > 0),
    meta: parseListMeta(body?.meta, page, limit),
  };
}

export function parseUpcomingCreditPayment(payload: unknown): CustomerUpcomingCreditPayment {
  const body = unwrapLegacyPayload(payload);
  if (!body) {
    return null;
  }

  const nextUpcoming = asRecord(body.nextUpcoming);
  const overdueSummary = asRecord(body.overdueSummary);

  return {
    totalNextPaymentKobo: Number(body.totalNextPaymentKobo) || 0,
    principalAmountKobo: Number(nextUpcoming?.principalAmountKobo) || 0,
    interestAmountKobo: Number(nextUpcoming?.interestAmountKobo) || 0,
    nextDueDate: nextUpcoming?.dueDate ? String(nextUpcoming.dueDate) : null,
    overdueCount: Number(overdueSummary?.count) || 0,
    totalOverdueKobo: Number(overdueSummary?.totalOverdueKobo) || 0,
  };
}
