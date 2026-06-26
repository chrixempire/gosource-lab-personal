import { createError, getRouterParam } from "h3";
import { fetchAdminLegacyApi } from "../../utils/admin-legacy-proxy";

export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({
      statusCode: 400,
      statusMessage: "Message id is required",
    });
  return fetchAdminLegacyApi(event, `/admin/messaging/${id}`, {
    fallbackMessage: "Unable to load message",
  });
});
