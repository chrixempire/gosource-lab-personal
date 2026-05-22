import { readBody } from 'h3';
import { postAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown>;
  return postAdminLegacyApi(event, '/admin/role', body, {
    fallbackMessage: 'Unable to create role',
  });
});
