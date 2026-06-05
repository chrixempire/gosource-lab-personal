import type { H3Event } from 'h3';
import { fetchAdminLegacyApi } from './admin-legacy-proxy';
import { readCreditPaginationQuery } from './credit-list-query';
import { readLegacyQueryArray, readLegacyQueryValue } from './legacy-query';
import { unwrapLegacyPayload } from './legacy-payload';

const MAX_FILTER_FETCH_LIMIT = 200;

type ListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

function paginateInMemory<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const skip = (safePage - 1) * limit;

  const meta: ListMeta = {
    page: safePage,
    limit,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };

  return { slice: items.slice(skip, skip + limit), meta };
}

function businessHaystack(business: Record<string, unknown> | undefined) {
  if (!business) return '';
  const accountType = String(business.accountType ?? '');
  if (accountType === 'individual') {
    return `${business.firstName ?? ''} ${business.lastName ?? ''}`.trim();
  }
  return String(business.businessName ?? '');
}

function readApplicationListQuery(query: Record<string, unknown>) {
  return {
    ...readCreditPaginationQuery(query),
    applicationType: readLegacyQueryArray(query, 'applicationType'),
    status: readLegacyQueryArray(query, 'status'),
  };
}

function readRequestListQuery(query: Record<string, unknown>) {
  return {
    ...readCreditPaginationQuery(query),
    requestType: readLegacyQueryArray(query, 'requestType'),
    status: readLegacyQueryArray(query, 'status'),
  };
}

function readRepaymentListQuery(query: Record<string, unknown>) {
  const base = readCreditPaginationQuery(query);
  return {
    page: base.page,
    limit: base.limit,
    sortBy: base.sortBy,
    sortOrder: base.sortOrder,
    search: base.search,
    fromDate: readLegacyQueryValue(query, 'fromDate') ?? base.startDate,
    toDate: readLegacyQueryValue(query, 'toDate') ?? base.endDate,
    businessIds: readLegacyQueryArray(query, 'businessId'),
    paymentMethod: readLegacyQueryArray(query, 'paymentMethod'),
  };
}

function applicationFiltersActive(
  filters: ReturnType<typeof readApplicationListQuery>,
) {
  return Boolean(
    filters.search ||
      filters.startDate ||
      filters.endDate ||
      (filters.applicationType?.length ?? 0) > 0 ||
      (filters.status?.length ?? 0) > 0,
  );
}

function requestFiltersActive(filters: ReturnType<typeof readRequestListQuery>) {
  return Boolean(
    filters.search ||
      filters.startDate ||
      filters.endDate ||
      (filters.requestType?.length ?? 0) > 0 ||
      (filters.status?.length ?? 0) > 0,
  );
}

function repaymentBffFiltersActive(
  filters: ReturnType<typeof readRepaymentListQuery>,
) {
  return (filters.paymentMethod?.length ?? 0) > 1 || (filters.businessIds?.length ?? 0) > 1;
}

function repaymentBusinessId(row: Record<string, unknown>) {
  const business = row.business as Record<string, unknown> | undefined;
  return String(business?._id ?? business?.id ?? row.business ?? '');
}

function matchesRepaymentBusiness(
  row: Record<string, unknown>,
  businessIds: string[] | undefined,
) {
  if (!businessIds?.length) return true;
  return businessIds.includes(repaymentBusinessId(row));
}

function matchesApplication(
  row: Record<string, unknown>,
  filters: ReturnType<typeof readApplicationListQuery>,
) {
  const status = String(row.status ?? '');
  const applicationType = String(row.applicationType ?? '');
  const createdAt = row.createdAt ? new Date(String(row.createdAt)).getTime() : 0;

  if (filters.status?.length && !filters.status.includes(status)) {
    return false;
  }
  if (filters.applicationType?.length && !filters.applicationType.includes(applicationType)) {
    return false;
  }
  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    if (createdAt < start) return false;
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate).getTime();
    if (createdAt > end) return false;
  }
  if (filters.search) {
    const id = String(row._id ?? row.id ?? '');
    const reference = id ? `#${id.slice(-6).toUpperCase()}` : '';
    const haystack = `${businessHaystack(row.business as Record<string, unknown>)} ${reference}`
      .toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

function matchesRequest(
  row: Record<string, unknown>,
  filters: ReturnType<typeof readRequestListQuery>,
) {
  const status = String(row.status ?? '');
  const requestType = String(row.requestType ?? '');
  const createdAt = row.createdAt ? new Date(String(row.createdAt)).getTime() : 0;

  if (filters.status?.length && !filters.status.includes(status)) {
    return false;
  }
  if (filters.requestType?.length && !filters.requestType.includes(requestType)) {
    return false;
  }
  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    if (createdAt < start) return false;
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate).getTime();
    if (createdAt > end) return false;
  }
  if (filters.search) {
    const id = String(row._id ?? row.id ?? '');
    const reference = id ? id.slice(-5).toUpperCase() : '';
    const haystack = `${businessHaystack(row.business as Record<string, unknown>)} ${reference}`
      .toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

function matchesRepaymentMethod(
  row: Record<string, unknown>,
  methods: string[] | undefined,
) {
  if (!methods?.length) return true;
  return methods.includes(String(row.paymentMethod ?? ''));
}

function rebuildListResponse(
  legacyResponse: unknown,
  listKey: string,
  items: unknown[],
  meta: ListMeta,
) {
  const root =
    legacyResponse && typeof legacyResponse === 'object'
      ? { ...(legacyResponse as Record<string, unknown>) }
      : { status: true, message: 'OK' };

  const priorData = unwrapLegacyPayload(legacyResponse) ?? {};
  return {
    ...root,
    data: {
      ...priorData,
      [listKey]: items,
      meta,
    },
  };
}

export async function fetchFilteredCreditApplications(
  event: H3Event,
  query: Record<string, unknown>,
) {
  const filters = readApplicationListQuery(query);

  if (!applicationFiltersActive(filters)) {
    return fetchAdminLegacyApi(event, '/admin/credit', {
      query: {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
      fallbackMessage: 'Unable to load credit applications',
    });
  }

  const legacyResponse = await fetchAdminLegacyApi(event, '/admin/credit', {
    query: { page: 1, limit: MAX_FILTER_FETCH_LIMIT, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
    fallbackMessage: 'Unable to load credit applications',
  });

  const body = unwrapLegacyPayload(legacyResponse);
  const credits = Array.isArray(body?.credits)
    ? (body.credits as Record<string, unknown>[])
    : [];
  const filtered = credits.filter((row) => matchesApplication(row, filters));
  const { slice, meta } = paginateInMemory(filtered, filters.page, filters.limit);

  return rebuildListResponse(legacyResponse, 'credits', slice, meta);
}

export async function fetchFilteredCreditRequests(
  event: H3Event,
  query: Record<string, unknown>,
) {
  const filters = readRequestListQuery(query);

  if (!requestFiltersActive(filters)) {
    return fetchAdminLegacyApi(event, '/admin/credit/requests', {
      query: {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
      fallbackMessage: 'Unable to load credit requests',
    });
  }

  const legacyResponse = await fetchAdminLegacyApi(event, '/admin/credit/requests', {
    query: { page: 1, limit: MAX_FILTER_FETCH_LIMIT, sortBy: filters.sortBy, sortOrder: filters.sortOrder },
    fallbackMessage: 'Unable to load credit requests',
  });

  const body = unwrapLegacyPayload(legacyResponse);
  const requests = Array.isArray(body?.requests)
    ? (body.requests as Record<string, unknown>[])
    : [];
  const filtered = requests.filter((row) => matchesRequest(row, filters));
  const { slice, meta } = paginateInMemory(filtered, filters.page, filters.limit);

  return rebuildListResponse(legacyResponse, 'requests', slice, meta);
}

export function buildPaymentHistoryLegacyQuery(
  filters: ReturnType<typeof readRepaymentListQuery>,
) {
  const query: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy ?? 'createdAt',
    sortOrder: filters.sortOrder ?? 'desc',
  };

  if (filters.search) {
    query.search = filters.search;
  }
  if (filters.fromDate) {
    query.fromDate = filters.fromDate;
  }
  if (filters.toDate) {
    query.toDate = filters.toDate;
  }
  if (filters.businessIds?.length === 1) {
    query.businessId = filters.businessIds[0]!;
  }
  if (filters.paymentMethod?.length === 1) {
    query.paymentMethod = filters.paymentMethod[0]!;
  }

  return query;
}

export async function fetchFilteredPaymentHistory(
  event: H3Event,
  query: Record<string, unknown>,
) {
  const filters = readRepaymentListQuery(query);
  const legacyQuery = buildPaymentHistoryLegacyQuery(filters);

  const legacyResponse = await fetchAdminLegacyApi(event, '/admin/credit/payment-history', {
    query: repaymentBffFiltersActive(filters)
      ? { ...legacyQuery, page: 1, limit: MAX_FILTER_FETCH_LIMIT }
      : legacyQuery,
    fallbackMessage: 'Unable to load repayment history',
  });

  if (!repaymentBffFiltersActive(filters)) {
    return legacyResponse;
  }

  const body = unwrapLegacyPayload(legacyResponse);
  const repayments = Array.isArray(body?.repayments)
    ? (body.repayments as Record<string, unknown>[])
    : [];
  const filtered = repayments.filter(
    (row) =>
      matchesRepaymentMethod(row, filters.paymentMethod) &&
      matchesRepaymentBusiness(row, filters.businessIds),
  );
  const { slice, meta } = paginateInMemory(filtered, filters.page, filters.limit);

  return rebuildListResponse(legacyResponse, 'repayments', slice, meta);
}
