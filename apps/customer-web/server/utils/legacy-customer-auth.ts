import type { EmployeeSessionData } from '@gosource/api-client';
import type { CustomerSessionState } from './customer-session-snapshot';

type LegacyAuthResponse = {
  message?: string;
  token?: string;
  data?: unknown;
  user?: Record<string, unknown> | null;
};

type LegacyJwtPayload = {
  sub?: string;
  id?: string;
  email?: string;
  user_type?: string;
  role?: string;
  businessId?: string;
  branchId?: string;
  firstName?: string;
  lastName?: string;
  exp?: number;
};

export function extractLegacyAccessToken(payload: LegacyAuthResponse) {
  if (typeof payload.token === 'string' && payload.token) {
    return payload.token;
  }

  if (typeof payload.data === 'string' && payload.data) {
    return payload.data;
  }

  if (isRecord(payload.data) && typeof payload.data.access_token === 'string') {
    return payload.data.access_token;
  }

  return null;
}

export function normalizeLegacyCustomerSession(payload: LegacyAuthResponse): CustomerSessionState | null {
  const accessToken = extractLegacyAccessToken(payload);
  if (!accessToken) {
    return null;
  }

  const decoded = decodeLegacyJwt(accessToken);
  if (!decoded) {
    return null;
  }

  const user = isRecord(payload.user) ? payload.user : isRecord(payload.data) ? payload.data : null;
  const legacyUserType = String(decoded.user_type ?? '').toUpperCase();

  if (legacyUserType === 'EMPLOYEE') {
    return {
      message: payload.message ?? 'Login successful',
      user_type: 'employee',
      data: {
        id: String(decoded.id ?? decoded.sub ?? ''),
        businessId: resolveLegacyBusinessId(user, decoded.businessId),
        branchId: toStringOrFallback(user?.branchId, decoded.branchId),
        email: toStringOrFallback(user?.email, decoded.email),
        firstName: toStringOrFallback(user?.firstName, decoded.firstName),
        lastName: toStringOrFallback(user?.lastName, decoded.lastName),
        phoneNumber: toStringOrFallback(user?.phoneNumber, ''),
        position: toStringOrFallback(user?.position, ''),
        role: normalizeEmployeeRole(toStringOrFallback(user?.role, decoded.role)),
        status: normalizeLegacyStatus(user?.status),
        businessName: resolveLegacyBusinessName(user) || null,
      },
    };
  }

  return {
    message: payload.message ?? 'Login successful',
    user_type: 'customer',
    data: {
      id: String(decoded.id ?? decoded.sub ?? ''),
      businessId: toStringOrFallback(user?._id, decoded.id ?? decoded.sub),
      email: toStringOrFallback(user?.email, decoded.email),
      firstName: toNullableString(user?.firstName),
      lastName: toNullableString(user?.lastName),
      phoneNumber: toNullableString(user?.phoneNumber),
      role: 'super_admin',
      status: normalizeLegacyStatus(user?.status),
      onboardingStep: toNumberOrUndefined(user?.onboardingStep),
    },
  };
}

export function isLegacyTokenExpired(token: string | null | undefined) {
  if (!token) {
    return true;
  }

  const decoded = decodeLegacyJwt(token);
  if (!decoded?.exp) {
    return false;
  }

  return decoded.exp * 1000 <= Date.now();
}

export function normalizeLegacySessionFromProfile(
  payload: unknown,
  snapshot: CustomerSessionState | null,
): CustomerSessionState | null {
  if (!snapshot?.user_type || !isRecord(payload)) {
    return snapshot;
  }

  const root = isRecord(payload.data) ? payload.data : payload;
  const message = toStringValue(payload.message) || snapshot.message || 'Profile fetched successfully';

  if (snapshot.user_type === 'employee') {
    const data = snapshot.data as EmployeeSessionData;
    return {
      message,
      user_type: 'employee',
      data: {
        id: toStringOrFallback(root._id, data.id),
        businessId: toStringOrFallback(root.businessId, data.businessId),
        branchId: toStringOrFallback(root.branchId, data.branchId),
        email: toStringOrFallback(root.email, data.email),
        firstName: toStringOrFallback(root.firstName, data.firstName),
        lastName: toStringOrFallback(root.lastName, data.lastName),
        phoneNumber: toStringOrFallback(root.phoneNumber, data.phoneNumber),
        position: toStringOrFallback(root.position, data.position),
        role: normalizeEmployeeRole(toStringOrFallback(root.role, data.role)),
        status: toBoolean(root.isDeactivated) ? 'inactive' : normalizeLegacyStatus(root.status),
      },
    };
  }

  const data = snapshot.data;
  return {
    message,
    user_type: 'customer',
    data: {
      id: toStringOrFallback(root._id, data.id),
      businessId: toStringOrFallback(root._id, data.businessId),
      email: toStringOrFallback(root.email, data.email),
      firstName: toNullableString(root.firstName) ?? data.firstName ?? null,
      lastName: toNullableString(root.lastName) ?? data.lastName ?? null,
      phoneNumber: toNullableString(root.phoneNumber) ?? data.phoneNumber ?? null,
      role: 'super_admin',
      status: normalizeLegacyStatus(root.status),
      onboardingStep: toNumberOrUndefined(root.onboardingStep) ?? ('onboardingStep' in data ? data.onboardingStep : undefined),
    },
  };
}

function decodeLegacyJwt(token: string | null | undefined): LegacyJwtPayload | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(segments[1]!, 'base64url').toString('utf8')) as LegacyJwtPayload;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStringOrFallback(value: unknown, fallback: unknown) {
  const primary = toStringValue(value);
  if (primary) {
    return primary;
  }

  return toStringValue(fallback);
}

function toStringValue(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (isRecord(value) && typeof value._id === 'string') {
    return value._id;
  }

  return '';
}

function resolveLegacyBusinessId(
  user: Record<string, unknown> | null,
  fallback: unknown,
) {
  if (!user) {
    return toStringValue(fallback);
  }

  const businessId = user.businessId;
  if (isRecord(businessId)) {
    return toStringOrFallback(businessId._id, fallback);
  }

  return toStringOrFallback(businessId, fallback);
}

function resolveLegacyBusinessName(user: Record<string, unknown> | null) {
  if (!user) {
    return '';
  }

  const direct = toStringValue(user.businessName);
  if (direct) {
    return direct;
  }

  const businessId = user.businessId;
  if (isRecord(businessId)) {
    return toStringValue(businessId.businessName);
  }

  return '';
}

function toNullableString(value: unknown) {
  const next = toStringValue(value);
  return next || null;
}

function normalizeEmployeeRole(role: string) {
  return role.toLowerCase() === 'admin' ? 'manager' : role.toLowerCase() || 'employee';
}

function normalizeLegacyStatus(status: unknown) {
  const value = toStringValue(status).toLowerCase();
  return value || 'active';
}

function toNumberOrUndefined(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toBoolean(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}
