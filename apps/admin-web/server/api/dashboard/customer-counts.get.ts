import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

type CustomerListResponse = {
  meta?: {
    totalDocuments?: number;
  };
};

export default defineEventHandler(async (event) => {
  const [active, inactive] = await Promise.all([
    fetchAdminLegacyApi<CustomerListResponse>(event, '/admin/customer', {
      query: { customerStatus: 'true', limit: 1, page: 1 },
      fallbackMessage: 'Unable to load active customer count',
    }),
    fetchAdminLegacyApi<CustomerListResponse>(event, '/admin/customer', {
      query: { customerStatus: 'false', limit: 1, page: 1 },
      fallbackMessage: 'Unable to load inactive customer count',
    }),
  ]);

  return {
    active: active.meta?.totalDocuments ?? 0,
    inactive: inactive.meta?.totalDocuments ?? 0,
  };
});
