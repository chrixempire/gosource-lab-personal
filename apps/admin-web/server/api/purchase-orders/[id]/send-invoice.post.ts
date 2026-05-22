import { createError, getRouterParam } from 'h3';
import {
  getLegacyReceiptEmailHost,
  postAdminLegacyApi,
} from '../../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Purchase order id is required' });
  }

  return postAdminLegacyApi(event, `/admin/purchase-order/${id}/send-receipt`, {}, {
    fallbackMessage: 'Unable to send invoice to suppliers',
    headers: { Host: getLegacyReceiptEmailHost(event) },
  });
});
