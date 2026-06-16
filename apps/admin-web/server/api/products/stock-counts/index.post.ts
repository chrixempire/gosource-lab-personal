import { readBody } from 'h3';
import { postAdminLegacyApi } from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);

  return postAdminLegacyApi(event, '/admin/product/stock-counts', body, {
    fallbackMessage: 'Unable to complete stock count',
  });
});
