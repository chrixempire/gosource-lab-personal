export function normalizeRoleName(role: unknown): string {
  return typeof role === 'string' ? role.trim().toLowerCase() : '';
}

export function isSuperAdminRoleName(role: unknown): boolean {
  const normalized = normalizeRoleName(role);
  if (!normalized) {
    return false;
  }

  if (
    normalized === 'super_admin' ||
    normalized === 'admin' ||
    normalized === 'super admin' ||
    normalized === 'superadmin' ||
    normalized === 'super-admin'
  ) {
    return true;
  }

  return /^super[\s_-]*admin$/.test(normalized);
}

export function roleHasPermission(
  permissions: unknown[],
  required: string,
): boolean {
  const normalizedRequired = required.trim().toLowerCase();
  if (!normalizedRequired) {
    return false;
  }

  return permissions.some((permission) => {
    return (
      typeof permission === 'string' &&
      permission.trim().toLowerCase() === normalizedRequired
    );
  });
}
