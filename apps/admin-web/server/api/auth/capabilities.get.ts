import { resolveAdminCapabilities } from '../../utils/admin-capabilities';

export default defineEventHandler(async (event) => {
  return resolveAdminCapabilities(event);
});
