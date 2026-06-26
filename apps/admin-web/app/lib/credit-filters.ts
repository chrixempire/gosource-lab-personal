import type {
  CreditApplicationListFilters,
  CreditApplicationType,
  CreditRepaymentListFilters,
  CreditRequestListFilters,
  CreditRequestType,
  CreditScheduleListFilters,
  CreditWorkflowStatus,
  RepaymentScheduleStatus,
} from '~/types/credit';

export const DEFAULT_CREDIT_APPLICATION_LIST_FILTERS: CreditApplicationListFilters = {
  page: 1,
  limit: 10,
  search: '',
  applicationType: [],
  status: [],
  startDate: '',
  endDate: '',
};

export const DEFAULT_CREDIT_REQUEST_LIST_FILTERS: CreditRequestListFilters = {
  page: 1,
  limit: 10,
  search: '',
  requestType: [],
  status: [],
  startDate: '',
  endDate: '',
};

export const DEFAULT_CREDIT_REPAYMENT_LIST_FILTERS: CreditRepaymentListFilters = {
  page: 1,
  limit: 10,
  search: '',
  businessIds: [],
  paymentMethod: [],
  startDate: '',
  endDate: '',
};

export const DEFAULT_CREDIT_SCHEDULE_LIST_FILTERS: CreditScheduleListFilters = {
  page: 1,
  limit: 10,
  search: '',
  status: [],
  startDate: '',
  endDate: '',
};

type RouteQuery = Record<string, string | string[] | undefined | null>;

function readString(query: RouteQuery, key: string) {
  const value = query[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return typeof value === 'string' ? value : '';
}

function readStringArray(query: RouteQuery, key: string) {
  const value = query[key];
  if (!value) {
    return [];
  }
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').filter(Boolean);
  }
  const values = Array.isArray(value) ? value : [value];
  return values.filter((entry) => entry.length > 0);
}

function readPagination(query: RouteQuery) {
  const page = Number(readString(query, 'page'));
  const limit = Number(readString(query, 'limit'));

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: [10, 25, 50, 100].includes(limit) ? limit : 10,
  };
}

function readOverduePagination(query: RouteQuery) {
  const page = Number(readString(query, 'overduePage'));
  const limit = Number(readString(query, 'overdueLimit'));

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: [10, 25, 50, 100].includes(limit) ? limit : 10,
  };
}

function filtersToRouteQuery(
  filters: {
    page: number;
    limit: number;
    search: string;
    startDate: string;
    endDate: string;
    status?: string[];
    applicationType?: string[];
    requestType?: string[];
    businessIds?: string[];
    paymentMethod?: string[];
  },
) {
  return {
    page: String(filters.page),
    limit: String(filters.limit),
    search: filters.search || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    status: filters.status && filters.status.length > 0 ? filters.status : undefined,
    applicationType:
      filters.applicationType && filters.applicationType.length > 0
        ? filters.applicationType
        : undefined,
    requestType:
      filters.requestType && filters.requestType.length > 0 ? filters.requestType : undefined,
    businessIds:
      filters.businessIds && filters.businessIds.length > 0 ? filters.businessIds : undefined,
    paymentMethod:
      filters.paymentMethod && filters.paymentMethod.length > 0
        ? filters.paymentMethod
        : undefined,
  };
}

export function parseCreditApplicationListFiltersFromQuery(
  query: RouteQuery,
): CreditApplicationListFilters {
  return {
    ...readPagination(query),
    search: readString(query, 'search'),
    applicationType: readStringArray(query, 'applicationType') as CreditApplicationType[],
    status: readStringArray(query, 'status') as CreditWorkflowStatus[],
    startDate: readString(query, 'startDate'),
    endDate: readString(query, 'endDate'),
  };
}

export function creditApplicationListFiltersToRouteQuery(filters: CreditApplicationListFilters) {
  return filtersToRouteQuery(filters);
}

export function parseCreditRequestListFiltersFromQuery(
  query: RouteQuery,
): CreditRequestListFilters {
  return {
    ...readPagination(query),
    search: readString(query, 'search'),
    requestType: readStringArray(query, 'requestType') as CreditRequestType[],
    status: readStringArray(query, 'status') as CreditWorkflowStatus[],
    startDate: readString(query, 'startDate'),
    endDate: readString(query, 'endDate'),
  };
}

export function creditRequestListFiltersToRouteQuery(filters: CreditRequestListFilters) {
  return filtersToRouteQuery(filters);
}

export function parseCreditRepaymentListFiltersFromQuery(
  query: RouteQuery,
): CreditRepaymentListFilters {
  return {
    ...readPagination(query),
    search: readString(query, 'search'),
    businessIds: readStringArray(query, 'businessIds'),
    paymentMethod: readStringArray(query, 'paymentMethod'),
    startDate: readString(query, 'startDate'),
    endDate: readString(query, 'endDate'),
  };
}

export function creditRepaymentListFiltersToRouteQuery(filters: CreditRepaymentListFilters) {
  return filtersToRouteQuery(filters);
}

export function parseCreditScheduleListFiltersFromQuery(
  query: RouteQuery,
): CreditScheduleListFilters {
  return {
    ...readPagination(query),
    search: readString(query, 'search'),
    status: readStringArray(query, 'status') as RepaymentScheduleStatus[],
    startDate: readString(query, 'startDate'),
    endDate: readString(query, 'endDate'),
  };
}

export function creditScheduleListFiltersToRouteQuery(filters: CreditScheduleListFilters) {
  return filtersToRouteQuery(filters);
}

export type CreditOverdueListFilters = {
  page: number;
  limit: number;
  search: string;
};

export function parseCreditOverdueListFiltersFromQuery(query: RouteQuery): CreditOverdueListFilters {
  const pagination = readOverduePagination(query);
  return {
    ...pagination,
    search: readString(query, 'overdueSearch'),
  };
}

export function creditOverdueListFiltersToRouteQuery(filters: CreditOverdueListFilters) {
  return {
    overduePage: String(filters.page),
    overdueLimit: String(filters.limit),
    overdueSearch: filters.search || undefined,
  };
}

export function creditApplicationListFiltersToApiQuery(filters: CreditApplicationListFilters) {
  const query: Record<string, string | number | string[]> = {
    page: filters.page,
    limit: filters.limit,
  };

  const search = filters.search.trim();
  if (search) {
    query.search = search;
  }
  if (filters.startDate) {
    query.startDate = filters.startDate;
  }
  if (filters.endDate) {
    query.endDate = filters.endDate;
  }
  if (filters.applicationType.length > 0) {
    query.applicationType = filters.applicationType;
  }
  if (filters.status.length > 0) {
    query.status = filters.status;
  }

  return query;
}

export function creditRequestListFiltersToApiQuery(filters: CreditRequestListFilters) {
  const query: Record<string, string | number | string[]> = {
    page: filters.page,
    limit: filters.limit,
  };

  const search = filters.search.trim();
  if (search) {
    query.search = search;
  }
  if (filters.startDate) {
    query.startDate = filters.startDate;
  }
  if (filters.endDate) {
    query.endDate = filters.endDate;
  }
  if (filters.requestType.length > 0) {
    query.requestType = filters.requestType;
  }
  if (filters.status.length > 0) {
    query.status = filters.status;
  }

  return query;
}

export function creditRepaymentListFiltersToApiQuery(filters: CreditRepaymentListFilters) {
  const query: Record<string, string | number | string[]> = {
    page: filters.page,
    limit: filters.limit,
  };

  const search = filters.search.trim();
  if (search) {
    query.search = search;
  }
  if (filters.startDate) {
    query.fromDate = filters.startDate;
  }
  if (filters.endDate) {
    query.toDate = filters.endDate;
  }
  if (filters.businessIds.length === 1) {
    query.businessId = filters.businessIds[0]!;
  } else if (filters.businessIds.length > 1) {
    query.businessId = filters.businessIds;
  }
  if (filters.paymentMethod.length > 0) {
    query.paymentMethod = filters.paymentMethod;
  }

  return query;
}

export function creditScheduleListFiltersToApiQuery(filters: CreditScheduleListFilters) {
  const query: Record<string, string | number | string[]> = {
    page: filters.page,
    limit: filters.limit,
  };

  const search = filters.search.trim();
  if (search) {
    query.search = search;
  }
  if (filters.startDate) {
    query.fromDate = filters.startDate;
  }
  if (filters.endDate) {
    query.toDate = filters.endDate;
  }
  if (filters.status.length === 1) {
    query.status = filters.status[0]!;
  }

  return query;
}

export type CustomerCreditHistoryFilters = {
  page: number;
  limit: number;
  search: string;
  requestType: string[];
  tenure: string[];
  status: string[];
  startDate: string;
  endDate: string;
};

export function customerCreditHistoryFiltersToApiQuery(filters: CustomerCreditHistoryFilters) {
  const query: Record<string, string | number | string[]> = {
    page: filters.page,
    limit: filters.limit,
  };

  const search = filters.search.trim();
  if (search) {
    query.search = search;
  }
  if (filters.requestType.length > 0) {
    query.requestType = filters.requestType;
  }
  if (filters.status.length > 0) {
    query.status = filters.status;
  }
  if (filters.startDate) {
    query.dateFrom = filters.startDate;
  }
  if (filters.endDate) {
    query.dateTo = filters.endDate;
  }

  return query;
}
