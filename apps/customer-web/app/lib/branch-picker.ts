/** Empty string = no branch filter (all branches) on list pages. */
export const ALL_BRANCHES_VALUE = '';

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
