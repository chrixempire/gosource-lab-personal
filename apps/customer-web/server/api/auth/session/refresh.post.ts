import { refreshCustomerSession } from '../../../utils/customer-auth-session';

export default defineEventHandler(async (event) => {
  return await refreshCustomerSession(event);
});
