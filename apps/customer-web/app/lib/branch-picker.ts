/** Empty string = no branch filter (all branches) on list pages. */
export const ALL_BRANCHES_VALUE = '';

/** `?branchId=all` on list pages (distinct from omitting the param = active peel branch). */
export const BRANCH_FILTER_QUERY_ALL = 'all';

export function branchFilterFromQueryParam(
  raw: string | string[] | null | undefined,
): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }

  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';
  if (!value) {
    return null;
  }

  if (value === BRANCH_FILTER_QUERY_ALL) {
    return ALL_BRANCHES_VALUE;
  }

  return value;
}

export function branchFilterToQueryParam(viewBranchId: string): string | undefined {
  if (viewBranchId === ALL_BRANCHES_VALUE) {
    return BRANCH_FILTER_QUERY_ALL;
  }

  const trimmed = viewBranchId.trim();
  return trimmed || undefined;
}

export function isAllBranchesFilter(branchId: string | null | undefined): boolean {
  return !branchId?.trim();
}

export function resolvePageListBranchId(
  viewBranchId: string,
  options?: { allowAll?: boolean },
): string | undefined {
  if (options?.allowAll !== false && isAllBranchesFilter(viewBranchId)) {
    return undefined;
  }

  const trimmed = viewBranchId.trim();
  return trimmed || undefined;
}

type LocationQueryLike = Record<string, string | string[] | null | undefined>;

/**
 * Branch id for shopping-lists fetch scope (empty = fan-out all branches).
 * Route `?branchId=` wins so reload matches the URL before view state catches up.
 */
export function resolveShoppingListsFilterBranchId(
  query: LocationQueryLike,
  options: {
    apiBranchId?: string;
    activeBranchId?: string;
    isEmployee?: boolean;
    employeeBranchId?: string;
  },
): string {
  if (options.isEmployee) {
    return options.employeeBranchId?.trim() ?? '';
  }

  const fromRoute = branchFilterFromQueryParam(query.branchId);
  if (fromRoute !== null) {
    return fromRoute;
  }

  if (options.apiBranchId?.trim()) {
    return options.apiBranchId.trim();
  }

  if (options.activeBranchId?.trim()) {
    return options.activeBranchId.trim();
  }

  return ALL_BRANCHES_VALUE;
}
