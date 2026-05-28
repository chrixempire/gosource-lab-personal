import { refreshAdminSession, toClientAdminSession } from '../../../utils/admin-auth-session';

export default defineEventHandler(async (event) => {
  return toClientAdminSession(await refreshAdminSession(event));
});
