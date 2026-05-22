import {
  clearCustomerAuthCookies,
  getRefreshTokenCookie,
} from '../../../utils/customer-auth-session';
import { getCustomerApiBaseUrl, isLegacyCustomerApiMode } from '../../../utils/customer-api-mode';

export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshTokenCookie(event);

  if (refreshToken && !isLegacyCustomerApiMode(event)) {
    try {
      await $fetch(`${getCustomerApiBaseUrl(event)}/auth/logout`, {
        method: 'POST',
        body: {
          refreshToken,
        },
      });
    } catch {
      // Always clear local auth cookies even if the upstream logout request fails.
    }
  }

  clearCustomerAuthCookies(event);

  return {
    message: 'Logged out successfully',
  };
});
