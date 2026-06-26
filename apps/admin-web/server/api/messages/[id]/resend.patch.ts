import { createError, getRouterParam } from "h3";
import { patchAdminLegacyApi } from "../../../utils/admin-legacy-proxy";

export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({
      statusCode: 400,
      statusMessage: "Message id is required",
    });
  return patchAdminLegacyApi(
    event,
    `/admin/messaging/${id}/resend`,
    {},
    {
      fallbackMessage: "Unable to resend message",
    },
  );
});
