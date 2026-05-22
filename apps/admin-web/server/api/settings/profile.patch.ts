import { readBody } from 'h3';
import {
  getAdminSessionSnapshot,
  mergeAdminSessionFromLegacyResponse,
  setAdminSessionSnapshot,
  toClientAdminSession,
} from '../../utils/admin-auth-session';
import { patchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown>;
  const response = await patchAdminLegacyApi(event, '/admin/admin/profile', body, {
    fallbackMessage: 'Unable to update profile',
  });

  const snapshot = getAdminSessionSnapshot(event);
  const merged = mergeAdminSessionFromLegacyResponse(snapshot, response);

  if (merged) {
    setAdminSessionSnapshot(event, merged);
    return toClientAdminSession(merged);
  }

  return response;
});
