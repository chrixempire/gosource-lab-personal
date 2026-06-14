import { deleteCookie, getCookie, setCookie, createError } from 'h3';
import type { H3Event } from 'h3';
import type {
  CustomerAuthResponse,
  CustomerMeResponse,
} from '@gosource/api-client';
import { getCustomerApiBaseUrl, isLegacyCustomerApiMode } from './customer-api-mode';
import { isLegacyTokenExpired, normalizeLegacySessionFromProfile } from './legacy-customer-auth';
import {
  deserializeCustomerSessionSnapshot,
  serializeCustomerSessionSnapshot,
  type CustomerSessionSnapshot,
  type CustomerSessionState,
} from './customer-session-snapshot';

const ACCESS_COOKIE_NAME = 'gosource_customer_access';
const REFRESH_COOKIE_NAME = 'gosource_customer_refresh';
const SESSION_COOKIE_NAME = 'gosource_customer_session';
const ACCESS_MAX_AGE_SECONDS = 60 * 15;
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === 'production';
}

export function getAccessTokenCookie(event: H3Event) {
  return getCookie(event, ACCESS_COOKIE_NAME) ?? null;
}

export function getRefreshTokenCookie(event: H3Event) {
  return getCookie(event, REFRESH_COOKIE_NAME) ?? null;
}

export function getCustomerSessionSnapshot(event: H3Event) {
  const raw = getCookie(event, SESSION_COOKIE_NAME);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CustomerSessionSnapshot>;
    return deserializeCustomerSessionSnapshot(parsed);
  } catch {
    return null;
  }
}

export function setCustomerAuthCookies(
  event: H3Event,
  tokens: {
    accessToken: string;
    refreshToken?: string;
  },
  session?: CustomerSessionState,
) {
  const secure = shouldUseSecureCookies();
  const refreshToken = tokens.refreshToken ?? tokens.accessToken;

  setCookie(event, ACCESS_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });

  setCookie(event, REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });

  if (session) {
    setCookie(event, SESSION_COOKIE_NAME, JSON.stringify(serializeCustomerSessionSnapshot(session)), {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }
}

export function clearCustomerAuthCookies(event: H3Event) {
  deleteCookie(event, ACCESS_COOKIE_NAME, {
    path: '/',
  });

  deleteCookie(event, REFRESH_COOKIE_NAME, {
    path: '/',
  });

  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/',
  });
}

export function toClientCustomerSession(
  payload: Pick<CustomerSessionState, 'message' | 'data' | 'user_type' | 'bootstrap'>,
): CustomerSessionState {
  return {
    message: payload.message,
    data: payload.data,
    user_type: payload.user_type ?? 'customer',
    bootstrap: payload.bootstrap,
  };
}

export function hasCachedBranchBootstrap(session: CustomerSessionState): boolean {
  return typeof session.bootstrap?.hasBranch === 'boolean';
}

export function patchCustomerSessionBootstrap(
  event: H3Event,
  bootstrap: NonNullable<CustomerSessionState['bootstrap']>,
): CustomerSessionState | null {
  const session = getCustomerSessionSnapshot(event);
  if (!session) {
    return null;
  }

  const nextSession: CustomerSessionState = {
    ...session,
    bootstrap: {
      ...(session.bootstrap ?? {}),
      ...bootstrap,
    },
  };

  const accessToken = getAccessTokenCookie(event);
  if (!accessToken) {
    return nextSession;
  }

  setCustomerAuthCookies(
    event,
    {
      accessToken,
      refreshToken: getRefreshTokenCookie(event) ?? accessToken,
    },
    nextSession,
  );

  return nextSession;
}

export async function attachBranchBootstrap(
  event: H3Event,
  session: CustomerSessionState,
  accessToken: string | null | undefined,
  options?: { force?: boolean },
): Promise<CustomerSessionState> {
  if (!accessToken || session.user_type !== 'customer' || !session.data?.businessId) {
    return session;
  }

  if (!options?.force && hasCachedBranchBootstrap(session)) {
    return session;
  }

  try {
    const result = await $fetch<Record<string, unknown>>(`${getCustomerApiBaseUrl(event)}/branch`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const items = Array.isArray(result.data) ? result.data : [];

    return {
      ...session,
      bootstrap: {
        hasBranch: items.length > 0,
      },
    };
  } catch {
    return session;
  }
}

export async function refreshCustomerSession(event: H3Event) {
  const refreshToken = getRefreshTokenCookie(event);

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No customer refresh session was found',
    });
  }

  if (isLegacyCustomerApiMode(event)) {
    const session = getCustomerSessionSnapshot(event);

    if (!session || isLegacyTokenExpired(refreshToken)) {
      clearCustomerAuthCookies(event);
      throw createError({
        statusCode: 401,
        statusMessage: 'No customer refresh session was found',
      });
    }

    const hydratedSession = await attachBranchBootstrap(event, session, refreshToken);

    setCustomerAuthCookies(
      event,
      {
        accessToken: refreshToken,
        refreshToken,
      },
      hydratedSession,
    );

    return hydratedSession;
  }

  try {
    const refreshed = await $fetch<CustomerAuthResponse>(`${getCustomerApiBaseUrl(event)}/auth/refresh`, {
      method: 'POST',
      body: {
        refreshToken,
      },
    });

    if (!refreshed.access_token || !refreshed.refresh_token || !refreshed.data) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Session refresh failed',
      });
    }

    const snapshot = getCustomerSessionSnapshot(event);
    const baseSession = toClientCustomerSession({
      message: refreshed.message,
      data: refreshed.data,
      user_type: refreshed.user_type,
      bootstrap: snapshot?.bootstrap,
    });
    const nextSession = await attachBranchBootstrap(event, baseSession, refreshed.access_token);

    setCustomerAuthCookies(event, {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
    }, nextSession);

    return nextSession;
  } catch (error) {
    clearCustomerAuthCookies(event);
    throw error;
  }
}

export async function fetchCustomerMe(
  event: H3Event,
  accessToken: string | null | undefined,
): Promise<CustomerSessionState> {
  if (isLegacyCustomerApiMode(event)) {
    const session = getCustomerSessionSnapshot(event);

    if (!session || !accessToken || isLegacyTokenExpired(accessToken)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No active session was found',
      });
    }

    const endpoint =
      session.user_type === 'employee'
        ? `${getCustomerApiBaseUrl(event)}/employee/${session.data.id}`
        : `${getCustomerApiBaseUrl(event)}/business`;

    try {
      const profile = await $fetch<Record<string, unknown>>(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const nextSession = normalizeLegacySessionFromProfile(profile, session) ?? session;
      return await attachBranchBootstrap(event, nextSession, accessToken);
    } catch {
      return session;
    }
  }

  const session = await $fetch<CustomerMeResponse>(`${getCustomerApiBaseUrl(event)}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!session.data) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No active session was found',
    });
  }

  return await attachBranchBootstrap(event, toClientCustomerSession({
    message: session.message,
    data: session.data,
    user_type: session.user_type,
  }), accessToken);
}
