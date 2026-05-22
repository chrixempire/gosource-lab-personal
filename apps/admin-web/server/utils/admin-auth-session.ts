import { createError, deleteCookie, getCookie, setCookie } from 'h3';
import type { H3Event } from 'h3';
import { getAdminLegacyApiBaseUrl } from './admin-api-base';

const ACCESS_COOKIE_NAME = 'gosource_admin_access';
const REFRESH_COOKIE_NAME = 'gosource_admin_refresh';
const SESSION_COOKIE_NAME = 'gosource_admin_session';
const ACCESS_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

import type { AdminSessionState, AdminSessionUser } from '~/types/admin-session';

export type { AdminSessionState, AdminSessionUser };

type LegacyApiEnvelope<T> = {
  message?: string;
  data?: T;
};

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === 'production';
}

export function getAccessTokenCookie(event: H3Event) {
  return getCookie(event, ACCESS_COOKIE_NAME) ?? null;
}

export function getRefreshTokenCookie(event: H3Event) {
  return getCookie(event, REFRESH_COOKIE_NAME) ?? null;
}

export function getAdminSessionSnapshot(event: H3Event): AdminSessionState | null {
  const raw = getCookie(event, SESSION_COOKIE_NAME);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminSessionState;
  } catch {
    return null;
  }
}

export function setAdminAuthCookies(
  event: H3Event,
  tokens: {
    accessToken: string;
    refreshToken?: string;
  },
) {
  const refreshToken = tokens.refreshToken ?? tokens.accessToken;

  setCookie(event, ACCESS_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    path: '/',
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });

  setCookie(event, REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    path: '/',
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function setAdminAuthCookie(event: H3Event, accessToken: string) {
  setAdminAuthCookies(event, { accessToken });
}

export function setAdminSessionSnapshot(event: H3Event, session: AdminSessionState) {
  setCookie(event, SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    path: '/',
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function setAdminAuthSession(
  event: H3Event,
  tokens: {
    accessToken: string;
    refreshToken?: string;
  },
  session: AdminSessionState,
) {
  setAdminAuthCookies(event, tokens);
  setAdminSessionSnapshot(event, session);
}

export async function refreshAdminSession(event: H3Event) {
  const refreshToken = getRefreshTokenCookie(event);

  if (!refreshToken) {
    clearAdminAuthCookies(event);
    throw createError({
      statusCode: 401,
      statusMessage: 'No admin refresh session was found',
    });
  }

  const baseUrl = getAdminLegacyApiBaseUrl(event);

  try {
    const refreshed = await $fetch<{
      message: string;
      data: AdminSessionUser;
      access_token: string;
      refresh_token?: string;
    }>(`${baseUrl}/admin/auth/refresh`, {
      method: 'POST',
      body: { refreshToken },
    });

    if (!refreshed?.access_token || !refreshed?.data?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Session refresh failed',
      });
    }

    const user = normalizeAdminSessionUser(refreshed.data);
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Session refresh failed',
      });
    }

    const session = toClientAdminSession({
      message: refreshed.message,
      data: user,
    });

    setAdminAuthSession(
      event,
      {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
      },
      session,
    );

    return session;
  } catch (error) {
    clearAdminAuthCookies(event);
    throw error;
  }
}

export function clearAdminAuthCookies(event: H3Event) {
  const options = { path: '/' };
  deleteCookie(event, ACCESS_COOKIE_NAME, options);
  deleteCookie(event, REFRESH_COOKIE_NAME, options);
  deleteCookie(event, SESSION_COOKIE_NAME, options);
}

export function toClientAdminSession(payload: AdminSessionState): AdminSessionState {
  return {
    message: payload.message,
    data: payload.data,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function resolveLegacyAdminRole(record: Record<string, unknown>) {
  if (typeof record.role === 'string' && record.role.trim()) {
    return record.role.trim();
  }

  const roleRef = asRecord(record.roleId);
  if (roleRef && typeof roleRef.name === 'string' && roleRef.name.trim()) {
    return roleRef.name.trim();
  }

  return undefined;
}

/** Legacy profile payloads use `_id`; login uses `id`. Normalize for session cookies. */
export function normalizeAdminSessionUser(raw: unknown): AdminSessionUser | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const id = String(record.id ?? record._id ?? '').trim();
  const email = typeof record.email === 'string' ? record.email.trim() : '';

  if (!id || !email) {
    return null;
  }

  const phone =
    typeof record.phoneNumber === 'string'
      ? record.phoneNumber
      : record.phoneNumber == null
        ? null
        : String(record.phoneNumber);

  const role = resolveLegacyAdminRole(record);
  const status = typeof record.status === 'string' ? record.status : undefined;

  return {
    id,
    email,
    ...(typeof record.firstName === 'string' ? { firstName: record.firstName } : {}),
    ...(typeof record.lastName === 'string' ? { lastName: record.lastName } : {}),
    ...(phone !== undefined ? { phoneNumber: phone } : {}),
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
  };
}

function mergeAdminSessionUser(
  current: AdminSessionUser | undefined,
  next: AdminSessionUser,
): AdminSessionUser {
  return {
    id: next.id || current?.id || '',
    email: next.email || current?.email || '',
    firstName: next.firstName ?? current?.firstName,
    lastName: next.lastName ?? current?.lastName,
    phoneNumber: next.phoneNumber !== undefined ? next.phoneNumber : current?.phoneNumber,
    role: next.role ?? current?.role,
    status: next.status ?? current?.status,
  };
}

export function mergeAdminSessionState(
  current: AdminSessionState | null,
  next: AdminSessionState,
): AdminSessionState {
  return {
    message: next.message ?? current?.message ?? 'Admin fetched successfully',
    data: mergeAdminSessionUser(current?.data, next.data),
  };
}

function resolveRoleFromAccessToken(accessToken: string) {
  try {
    const segment = accessToken.split('.')[1];
    if (!segment) {
      return undefined;
    }

    const json = JSON.parse(
      Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as Record<string, unknown>;

    return typeof json.role === 'string' && json.role.trim() ? json.role.trim() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeProfileResponse(payload: LegacyApiEnvelope<unknown>): AdminSessionState {
  const data = normalizeAdminSessionUser(payload?.data);
  if (!data) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No active admin session was found',
    });
  }

  return {
    message: payload.message ?? 'Admin fetched successfully',
    data,
  };
}

export function mergeAdminSessionFromLegacyResponse(
  current: AdminSessionState | null,
  payload: LegacyApiEnvelope<unknown>,
): AdminSessionState | null {
  const data = normalizeAdminSessionUser(payload?.data);
  if (!data) {
    return current;
  }

  return {
    message: payload.message ?? current?.message ?? 'Profile updated successfully',
    data: mergeAdminSessionUser(current?.data, data),
  };
}

export async function fetchAdminProfile(
  event: H3Event,
  accessToken: string,
  options?: { mergeWith?: AdminSessionState | null },
) {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  const response = await $fetch<LegacyApiEnvelope<AdminSessionUser>>(
    `${baseUrl}/admin/admin/profile`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  let session = normalizeProfileResponse(response);

  if (!session.data.role) {
    const roleFromToken = resolveRoleFromAccessToken(accessToken);
    if (roleFromToken) {
      session = {
        ...session,
        data: { ...session.data, role: roleFromToken },
      };
    }
  }

  if (options?.mergeWith) {
    session = mergeAdminSessionState(options.mergeWith, session);
  }

  return session;
}

export async function loginAdminOnLegacyApi(
  event: H3Event,
  body: { email: string; password: string },
) {
  const baseUrl = getAdminLegacyApiBaseUrl(event);

  return await $fetch<{
    message: string;
    data: AdminSessionUser;
    access_token: string;
    refresh_token: string;
  }>(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    body,
  });
}
