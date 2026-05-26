const STORAGE_PREFIX = 'customer-active-branch';

function storageKey(businessId: string) {
  return `${STORAGE_PREFIX}:${businessId}`;
}

export function readStoredActiveBranchId(businessId: string): string | null {
  if (!import.meta.client || !businessId.trim()) {
    return null;
  }

  try {
    const value = localStorage.getItem(storageKey(businessId))?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function writeStoredActiveBranchId(businessId: string, branchId: string) {
  if (!import.meta.client || !businessId.trim() || !branchId.trim()) {
    return;
  }

  try {
    localStorage.setItem(storageKey(businessId), branchId.trim());
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function clearStoredActiveBranchId(businessId: string) {
  if (!import.meta.client || !businessId.trim()) {
    return;
  }

  try {
    localStorage.removeItem(storageKey(businessId));
  } catch {
    // Ignore.
  }
}
