import { readBody } from 'h3';
import { getLegacyReceiptEmailHost, postAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);

  return postAdminLegacyApi(event, '/admin/purchase-order', body, {
    fallbackMessage: 'Unable to create purchase order',
    headers: { Host: getLegacyReceiptEmailHost(event) },
  });
});
