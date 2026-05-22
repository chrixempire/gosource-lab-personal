import { readBody } from 'h3';
import { patchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    rearrangedCategories?: Array<{ id: string; position: number }>;
  }>(event);

  return patchAdminLegacyApi(
    event,
    '/admin/category/rearrange',
    {
      rearrangedCategories: body.rearrangedCategories ?? [],
    },
    {
      fallbackMessage: 'Unable to rearrange categories',
    },
  );
});
