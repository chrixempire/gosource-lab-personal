import { clearAdminAuthCookies } from '../../../utils/admin-auth-session';

export default defineEventHandler(async (event) => {
  clearAdminAuthCookies(event);

  return {
    message: 'Signed out successfully',
  };
});
