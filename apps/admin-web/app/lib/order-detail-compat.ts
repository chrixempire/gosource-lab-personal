/** Shared order actor / customer field resolution for admin order detail views. */

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function displayOrDash(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '—';
  }

  const trimmed = String(value).trim();
  return trimmed || '—';
}

export type ResolvedOrderActor = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  position: string | null;
  role: string | null;
};

function readActorString(actor: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = actor[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function mapLegacyOrderActor(raw: unknown): ResolvedOrderActor | null {
  if (!raw || typeof raw === 'string') {
    return null;
  }

  const actor = asRecord(raw);
  if (!actor) {
    return null;
  }

  const id = displayOrDash(actor._id ?? actor.id);
  const email = typeof actor.email === 'string' ? actor.email.trim() : '';
  const hasIdentity =
    id !== '—' ||
    email ||
    typeof actor.firstName === 'string' ||
    typeof actor.lastName === 'string';

  if (!hasIdentity) {
    return null;
  }

  return {
    firstName: typeof actor.firstName === 'string' ? actor.firstName : null,
    lastName: typeof actor.lastName === 'string' ? actor.lastName : null,
    email,
    phoneNumber: readActorString(actor, ['phoneNumber', 'phone', 'mobile']),
    position: readActorString(actor, ['position', 'jobTitle', 'job_title', 'title']),
    role: readActorString(actor, ['role', 'employeeRole']),
  };
}

export function resolveOrderInitiator(order: Record<string, unknown>) {
  const request = asRecord(order.request);
  return mapLegacyOrderActor(request?.initiator) ?? mapLegacyOrderActor(order.initiator);
}

export function resolveOrderBusiness(order: Record<string, unknown>) {
  const business = order.business;
  if (typeof business === 'string') {
    return { _id: business };
  }

  return asRecord(business);
}

export function formatOrderActorName(actor: ResolvedOrderActor | null) {
  if (!actor) {
    return null;
  }

  const name = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
  return name || actor.email || null;
}

export function resolveOrderBranchLabel(order: Record<string, unknown>) {
  const branch =
    typeof order.branch === 'string' ? null : asRecord(order.branch);

  if (!branch) {
    return '—';
  }

  const code = displayOrDash(branch.branchCode);
  if (code !== '—') {
    return code;
  }

  return displayOrDash(branch.branchName);
}

export function formatEmployeeRoleLabel(role: string) {
  const normalized = role.trim().toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'super_admin') {
    return 'Super Admin';
  }
  if (normalized === 'manager') {
    return 'Manager';
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

export function resolveCustomerPosition(actor: ResolvedOrderActor | null) {
  if (!actor) {
    return '—';
  }

  if (actor.position) {
    return actor.position;
  }

  if (actor.role) {
    return formatEmployeeRoleLabel(actor.role);
  }

  return '—';
}
