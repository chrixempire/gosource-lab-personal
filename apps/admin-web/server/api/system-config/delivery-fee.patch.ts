import { readBody } from 'h3';
import { patchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown>;
  return patchAdminLegacyApi(event, '/admin/system-config/delivery-fee', body, {
    fallbackMessage: 'Unable to update delivery fee',
  });
});
