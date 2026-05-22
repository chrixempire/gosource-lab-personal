import type { CustomerMeResponse } from '@gosource/api-client';
import {
  fetchCustomerMe,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  refreshCustomerSession,
  toClientCustomerSession,
} from '~~/server/utils/customer-auth-session';

function isUnauthorized(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error || 'statusCode' in error) &&
    (Number((error as { status?: number; statusCode?: number }).status) === 401 ||
      Number((error as { status?: number; statusCode?: number }).statusCode) === 401)
  );
}

export default defineNuxtPlugin(async () => {
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const sessionResolved = useState('customer-session-resolved', () => false);
  const route = useRoute();

  if (route.path.startsWith('/auth')) {
    sessionResolved.value = true;
    return;
  }

  if (session.value?.data?.businessId) {
    sessionResolved.value = true;
    return;
  }

  const event = useRequestEvent();

  if (!event) {
    session.value = null;
    sessionResolved.value = true;
    return;
  }

  const accessToken = getAccessTokenCookie(event);
  const refreshToken = getRefreshTokenCookie(event);

  if (!accessToken && !refreshToken) {
    session.value = null;
    sessionResolved.value = true;
    return;
  }

  try {
    if (!accessToken && refreshToken) {
      session.value = await refreshCustomerSession(event);
      return;
    }

    const me = await fetchCustomerMe(event, accessToken!);

    if (!me.data) {
      session.value = null;
      return;
    }

    session.value = toClientCustomerSession({
      message: me.message,
      data: me.data,
      user_type: me.user_type,
    });
  } catch (error) {
    if (refreshToken && isUnauthorized(error)) {
      try {
        session.value = await refreshCustomerSession(event);
        return;
      } catch {
        session.value = null;
        return;
      }
    }

    session.value = null;
  } finally {
    sessionResolved.value = true;
  }
});
