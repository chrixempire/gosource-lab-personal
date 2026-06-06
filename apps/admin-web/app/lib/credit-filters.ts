import type {
  CreditApplicationListFilters,
  CreditRepaymentListFilters,
  CreditRequestListFilters,
  CreditScheduleListFilters,
} from '~/types/credit';

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
    query.status = filters.status[0];
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
