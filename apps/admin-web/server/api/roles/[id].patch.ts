import { readBody } from 'h3';
import { patchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = (await readBody(event)) as Record<string, unknown>;
  return patchAdminLegacyApi(event, `/admin/role/${id}`, body, {
    fallbackMessage: 'Unable to update role',
  });
});
