import {
  clearAdminAuthCookies,
  getAccessTokenCookie,
} from '../../../utils/admin-auth-session';
import { getAdminLegacyApiBaseUrl } from '../../../utils/admin-api-base';

export default defineEventHandler(async (event) => {
  // Best-effort: tell legacy-api so it can record the logout in the activity
  // log. Must never block or fail the local sign-out.
  try {
    const token = getAccessTokenCookie(event);
    if (token) {
      const baseUrl = getAdminLegacyApiBaseUrl(event);
      await $fetch(`${baseUrl}/admin/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // ignore — sign-out always proceeds locally
  }

  clearAdminAuthCookies(event);

  return {
    message: 'Signed out successfully',
  };
});
