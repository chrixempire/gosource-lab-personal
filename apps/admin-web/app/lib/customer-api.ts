import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import { mapLegacyOrderToListItem } from '~/lib/order-details';
import { customerAccountTypeLabel } from '~/lib/customer-constants';
import type {
  AdminCustomerListItem,
  CustomerBranchItem,
  CustomerDetailView,
  CustomerWalletTransaction,
  LegacyCustomerRow,
} from '~/types/customers';
import type { InventoryTableMeta } from '~/types/inventory';
import type { AdminOrderListItem, LegacyOrderRow } from '~/types/orders';

function formatDateLabel(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTitleCase(value: string | null | undefined) {
  if (!value) return '—';
  return value
    .trim()
    .replace(/[_\s]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function customerDisplayName(row: LegacyCustomerRow) {
  if (row.accountType === 'individual') {
    return `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || row.email || '—';
  }
  return (row.businessName ?? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim()) || '—';
}

function customerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

export function mapLegacyCustomerToListItem(row: LegacyCustomerRow): AdminCustomerListItem {
  const id = String(row._id ?? row.id ?? '');
  const displayName = customerDisplayName(row);
  const active = row.active !== false;

  return {
    id,
    displayName,
    email: row.email ?? '—',
    phoneNumber: row.phoneNumber ?? '—',
    accountType: String(row.accountType ?? 'business'),
    accountTypeLabel: customerAccountTypeLabel(String(row.accountType ?? 'business')),
    status: active ? 'active' : 'inactive',
    statusLabel: active ? 'Active' : 'Inactive',
    useCredit: row.canBuyOnCredit === true,
    createdAt: row.createdAt ?? null,
    createdAtLabel: formatDateLabel(row.createdAt),
    initials: customerInitials(displayName),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseCustomersListResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
) {
  const body = unwrapLegacyPayload(payload) ?? asRecord(payload);

  const nestedData =
    body?.data && typeof body.data === 'object' && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : null;

  const customers = Array.isArray(body?.data)
    ? (body.data as LegacyCustomerRow[])
    : Array.isArray(nestedData?.data)
      ? (nestedData.data as LegacyCustomerRow[])
      : Array.isArray(body?.customers)
        ? (body.customers as LegacyCustomerRow[])
        : [];

  const metaRaw =
    (body?.meta as Record<string, unknown> | undefined) ??
    (nestedData?.meta as Record<string, unknown> | undefined);
  const total = Number(metaRaw?.totalDocuments) || customers.length;
  const limit = Number(metaRaw?.limit) || fallbackLimit;
  const page = Number(metaRaw?.page) || fallbackPage;
  const totalPages = Math.max(1, Number(metaRaw?.totalPages) || Math.ceil(total / limit) || 1);

  const meta: InventoryTableMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: metaRaw?.hasNext === true || page < totalPages,
    hasPrev: metaRaw?.hasPrev === true || page > 1,
  };

  return {
    rows: customers.map(mapLegacyCustomerToListItem),
    meta,
  };
}

export function filterCustomersByAccountType(
  rows: AdminCustomerListItem[],
  accountType: string | null,
) {
  if (!accountType || accountType === 'all') {
    return rows;
  }
  return rows.filter((row) => row.accountType === accountType);
}

export function computeCustomerStats(rows: AdminCustomerListItem[], total: number) {
  return {
    total,
    business: rows.filter((row) => row.accountType === 'business').length,
    individual: rows.filter((row) => row.accountType === 'individual').length,
  };
}

export function parseCustomerDetail(payload: unknown): CustomerDetailView | null {
  const body = unwrapLegacyPayload(payload);
  if (!body?.customer || typeof body.customer !== 'object') {
    return null;
  }

  const customer = body.customer as LegacyCustomerRow;
  const orders = body.orders as { totalOrders?: number; totalSpent?: number } | undefined;
  const wallet = asRecord(body.wallet);
  const id = String(customer._id ?? customer.id ?? '');
  const displayName = customerDisplayName(customer);
  const active = customer.active !== false;

  return {
    id,
    displayName,
    contactName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || '—',
    imageUrl:
      (typeof (customer as Record<string, unknown>).imageUrl === 'string' &&
        String((customer as Record<string, unknown>).imageUrl)) ||
      (typeof (customer as Record<string, unknown>).profilePicture === 'string' &&
        String((customer as Record<string, unknown>).profilePicture)) ||
      (typeof (customer as Record<string, unknown>).avatar === 'string' &&
        String((customer as Record<string, unknown>).avatar)) ||
      null,
    email: customer.email ?? '—',
    phoneNumber: customer.phoneNumber ?? '—',
    accountType: String(customer.accountType ?? 'business'),
    status: active ? 'active' : 'inactive',
    statusLabel: active ? 'Active' : 'Inactive',
    useCredit: customer.canBuyOnCredit === true,
    createdAtLabel: formatDateLabel(customer.createdAt),
    totalOrders: Number(orders?.totalOrders) || 0,
    totalSpent: Number(orders?.totalSpent) || 0,
    totalBranches: Number(body.totalBranches) || 0,
    totalEmployees: Number(body.totalEmployees) || 0,
    walletBalance: wallet?.balance != null ? Number(wallet.balance) : null,
    walletCurrency: typeof wallet?.currency === 'string' ? wallet.currency : null,
    wallet: wallet
      ? {
        bankName: typeof wallet.bankName === 'string' ? wallet.bankName : null,
        accountName: typeof wallet.accountName === 'string' ? wallet.accountName : null,
        accountNumber: typeof wallet.accountNumber === 'string' ? wallet.accountNumber : null,
        balance: wallet.balance != null ? Number(wallet.balance) : null,
        }
      : null,
  };
}

export function parseCustomerOrdersResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): { rows: AdminOrderListItem[]; meta: InventoryTableMeta } {
  const body = unwrapLegacyPayload(payload);
  const orders = Array.isArray(body?.orders) ? (body.orders as LegacyOrderRow[]) : [];
  const metaRaw = body?.meta as Record<string, unknown> | undefined;

  const total = Number(metaRaw?.totalDocuments) || 0;
  const limit = Number(metaRaw?.limit) || fallbackLimit;
  const page = Number(metaRaw?.page) || fallbackPage;
  const totalPages = Math.max(1, Number(metaRaw?.totalPages) || Math.ceil(total / limit) || 1);

  return {
    rows: orders.map(mapLegacyOrderToListItem),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function parseCustomerTransactions(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): { rows: CustomerWalletTransaction[]; meta: InventoryTableMeta } {
  const body = unwrapLegacyPayload(payload);
  const rows = Array.isArray(body?.data) ? body.data : Array.isArray(payload) ? payload : [];
  const pagination = (body?.pagination ?? body?.meta) as Record<string, unknown> | undefined;

  const total = Number(pagination?.total) || rows.length;
  const limit = Number(pagination?.limit) || fallbackLimit;
  const page = Number(pagination?.page) || fallbackPage;
  const totalPages = Math.max(1, Number(pagination?.totalPages) || Math.ceil(total / limit) || 1);

  const mapped = (rows as Record<string, unknown>[]).map((row) => ({
    id: String(row._id ?? row.id ?? ''),
    reference: String(row.reference ?? row.name ?? '—'),
    description: String(row.description ?? 'Transaction'),
    amountLabel: formatDashboardCurrency(Number(row.amount ?? 0)),
    typeLabel: formatTitleCase(String(row.type ?? row.transactionType ?? '—')),
    statusLabel: formatTitleCase(String(row.status ?? '—')),
    createdAtLabel: formatDateLabel(String(row.createdAt ?? '')),
  }));

  return {
    rows: mapped,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

export function parseCustomerBranches(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): { rows: CustomerBranchItem[]; meta: InventoryTableMeta } {
  const body = unwrapLegacyPayload(payload);
  const nestedData = asRecord(body?.data);
  const branches = Array.isArray(body?.branches)
    ? body.branches
    : Array.isArray(nestedData?.branches)
      ? nestedData.branches
      : Array.isArray(body?.data)
        ? body.data
        : [];

  const metaRaw =
    (body?.meta as Record<string, unknown> | undefined) ??
    (nestedData?.meta as Record<string, unknown> | undefined);
  const total = Number(metaRaw?.totalDocuments) || branches.length;
  const limit = Number(metaRaw?.limit) || fallbackLimit;
  const page = Number(metaRaw?.page) || fallbackPage;
  const totalPages = Math.max(1, Number(metaRaw?.totalPages) || Math.ceil(total / limit) || 1);

  return {
    rows: (branches as Record<string, unknown>[]).map((branch) => {
      const streetName = String(branch.streetName ?? '').trim();
      const lga = String(branch.lga ?? '').trim();
      const address =
        streetName && lga
          ? `${streetName}, ${lga}`
          : streetName || lga || String(branch.address ?? branch.location ?? '—');

      return {
        id: String(branch._id ?? branch.id ?? ''),
        name: String(branch.name ?? branch.branchName ?? '—'),
        address,
        statusLabel:
          branch.active === false || branch.isDeactivated === true ? 'Inactive' : 'Active',
        isHeadquarter: branch.isHeadquarter === true || branch.isHQ === true,
        membersCount: Array.isArray(branch.employees) ? branch.employees.length : 0,
        totalSpentLabel: formatDashboardCurrency(Number(branch.totalAmountProcured ?? 0)),
        createdAtLabel: formatDateLabel(String(branch.createdAt ?? '')),
      };
    }),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: metaRaw?.hasNext === true || page < totalPages,
      hasPrev: metaRaw?.hasPrev === true || page > 1,
    },
  };
}
