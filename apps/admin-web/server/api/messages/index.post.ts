import { readBody } from "h3";
import { postAdminLegacyApi } from "../../utils/admin-legacy-proxy";

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  return postAdminLegacyApi(event, "/admin/messaging", body, {
    fallbackMessage: "Unable to create message",
  });
});
