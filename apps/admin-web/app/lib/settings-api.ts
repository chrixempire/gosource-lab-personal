import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import { adminUserStatusLabel, formatAdminRoleLabel } from '~/lib/settings-constants';
import type {
  AdminRoleDetail,
  AdminRoleListItem,
  AdminRoleMember,
  AdminUserListItem,
  DeliveryFeeConfig,
  PermissionSection,
  SystemConfigEntry,
} from '~/types/settings';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readId(row: Record<string, unknown>) {
  const raw = row._id ?? row.id;
  return raw ? String(raw) : '';
}

function formatDateLabel(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function readRoleName(row: Record<string, unknown>) {
  const role = row.role;
  if (typeof role === 'string' && role.trim()) {
    return role.trim();
  }
  const roleObj = asRecord(role);
  if (roleObj && typeof roleObj.name === 'string') {
    return roleObj.name;
  }
  return '—';
}

function readRoleId(row: Record<string, unknown>) {
  const role = row.role;
  if (typeof role === 'string' && role.trim()) {
    return role.trim();
  }
  const roleObj = asRecord(role);
  if (roleObj) {
    return readId(roleObj) || null;
  }
  return typeof row.roleId === 'string' ? row.roleId : null;
}

export function parseAdminUsersList(payload: unknown): AdminUserListItem[] {
  const root = asRecord(payload);
  const rows = asArray(root?.data ?? payload);

  return rows
    .map((row) => {
      const record = asRecord(row);
      if (!record) return null;

      const id = readId(record);
      if (!id) return null;

      const status = String(record.status ?? 'inactive');
      const firstName = String(record.firstName ?? '').trim();
      const lastName = String(record.lastName ?? '').trim();

      return {
        id,
        firstName,
        lastName,
        email: String(record.email ?? '').trim(),
        role: readRoleName(record),
        roleId: readRoleId(record),
        status,
        statusLabel: adminUserStatusLabel(status),
        createdAt: record.createdAt ? String(record.createdAt) : null,
        createdAtLabel: formatDateLabel(record.createdAt),
      } satisfies AdminUserListItem;
    })
    .filter((row): row is AdminUserListItem => Boolean(row));
}

export function parseAdminRolesList(payload: unknown): AdminRoleListItem[] {
  const root = asRecord(payload);
  const rows = asArray(root?.data ?? payload);

  return rows
    .map((row) => {
      const record = asRecord(row);
      if (!record) return null;

      const id = readId(record);
      if (!id) return null;

      const members = asArray(record.members);
      const userCount =
        Number(record.userCount ?? record.usersCount ?? record.membersCount ?? members.length) ||
        0;

      return {
        id,
        name: String(record.name ?? '').trim() || '—',
        description: String(record.description ?? '').trim(),
        userCount,
        createdAt: record.createdAt ? String(record.createdAt) : null,
        createdAtLabel: formatDateLabel(record.createdAt),
      } satisfies AdminRoleListItem;
    })
    .filter((row): row is AdminRoleListItem => Boolean(row));
}

/** Legacy roles may store permissions as a flat string[] or a grouped catalog object. */
export function flattenRawRolePermissions(raw: unknown): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .flatMap((entry) => {
        if (typeof entry === 'string') {
          const value = entry.trim();
          return value ? [value] : [];
        }

        const record = asRecord(entry);
        if (!record) return [];

        const key = record.key ?? record.value ?? record.name ?? record.permission;
        return typeof key === 'string' && key.trim() ? [key.trim()] : [];
      })
      .filter(Boolean);
  }

  const grouped = asRecord(raw);
  if (!grouped) return [];

  const keys: string[] = [];
  for (const sectionValue of Object.values(grouped)) {
    if (Array.isArray(sectionValue)) {
      keys.push(
        ...sectionValue
          .map((entry) => String(entry).trim())
          .filter(Boolean),
      );
      continue;
    }

    const section = asRecord(sectionValue);
    if (section) {
      keys.push(...Object.keys(section));
    }
  }

  return keys;
}

/** Map role permission strings onto catalog keys (handles labels and legacy enum names). */
export function normalizeRolePermissions(
  raw: unknown,
  sections: PermissionSection[],
): string[] {
  const flat = flattenRawRolePermissions(raw);
  if (!flat.length || !sections.length) {
    return [...new Set(flat)];
  }

  const validKeys = new Set(sections.flatMap((section) => section.items.map((item) => item.value)));
  const lookup = new Map<string, string>();

  for (const section of sections) {
    for (const item of section.items) {
      lookup.set(item.value.toLowerCase(), item.value);
      lookup.set(item.label.toLowerCase(), item.value);
    }
  }

  const normalized: string[] = [];

  for (const entry of flat) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    if (validKeys.has(trimmed)) {
      normalized.push(trimmed);
      continue;
    }

    const direct = lookup.get(trimmed.toLowerCase());
    if (direct) {
      normalized.push(direct);
      continue;
    }

    const snake = trimmed.replace(/\s+/g, '_').toLowerCase();
    if (validKeys.has(snake)) {
      normalized.push(snake);
      continue;
    }

    const enumSnake = trimmed
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
    if (validKeys.has(enumSnake)) {
      normalized.push(enumSnake);
    }
  }

  return [...new Set(normalized)];
}

export function parseAdminRoleDetail(payload: unknown): AdminRoleDetail | null {
  const record = unwrapLegacyPayload(payload) ?? asRecord(payload);
  if (!record) return null;

  const id = readId(record);
  if (!id) return null;

  const permissions = flattenRawRolePermissions(record.permissions);

  const members = asArray(record.members)
    .map((row) => {
      const member = asRecord(row);
      if (!member) return null;
      const memberId = readId(member);
      if (!memberId) return null;
      const status = String(member.status ?? 'inactive');
      return {
        id: memberId,
        firstName: String(member.firstName ?? '').trim(),
        lastName: String(member.lastName ?? '').trim(),
        email: String(member.email ?? '').trim(),
        status,
        statusLabel: adminUserStatusLabel(status),
      } satisfies AdminRoleMember;
    })
    .filter((row): row is AdminRoleMember => Boolean(row));

  return {
    id,
    name: String(record.name ?? '').trim() || '—',
    description: String(record.description ?? '').trim(),
    userCount: members.length,
    createdAt: record.createdAt ? String(record.createdAt) : null,
    createdAtLabel: formatDateLabel(record.createdAt),
    permissions,
    members,
  };
}

export function parsePermissionSections(payload: unknown): PermissionSection[] {
  const root = unwrapLegacyPayload(payload) ?? asRecord(payload);
  const data = root?.data ?? root;
  const record = asRecord(data);
  if (!record) return [];

  return Object.entries(record).map(([title, value]) => {
    const section = asRecord(value);
    const items = section
      ? Object.entries(section).map(([key, label]) => ({
          value: key,
          label: String(label),
        }))
      : [];

    return { title, items };
  });
}

export function parseSystemConfig(payload: unknown): SystemConfigEntry[] {
  const root = asRecord(payload);
  const rows = asArray(root?.data ?? payload);

  return rows
    .flatMap((row): SystemConfigEntry[] => {
      const record = asRecord(row);
      if (!record || typeof record.key !== 'string') return [];
      return [{
        key: record.key,
        value: record.value,
        description:
          typeof record.description === 'string' ? record.description : null,
      }];
    });
}

export function parseDeliveryFeeConfig(entries: SystemConfigEntry[]): DeliveryFeeConfig | null {
  const entry = entries.find((item) => item.key === 'delivery_fee_config');
  const value = asRecord(entry?.value);
  if (!value) return null;

  return {
    threshold: Number(value.threshold ?? 0),
    baseFee1: Number(value.baseFee1 ?? 0),
    baseFee2: Number(value.baseFee2 ?? 0),
    percentage1: Number(value.percentage1 ?? 0),
    percentage2: Number(value.percentage2 ?? 0),
  };
}

export function formatSettingsRoleLabel(role: string | undefined) {
  if (!role) return '—';
  return formatAdminRoleLabel(role);
}
