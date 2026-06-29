import { createError, getRouterParam, readBody } from "h3";
import { patchAdminLegacyApi } from "../../../utils/admin-legacy-proxy";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Feedback id is required",
    });
  }
  const body = (await readBody(event)) as { status?: string };
  return patchAdminLegacyApi(
    event,
    `/admin/feedback/${id}/status`,
    { status: body.status },
    { fallbackMessage: "Unable to update feedback" },
  );
});
