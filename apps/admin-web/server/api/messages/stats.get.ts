import { fetchAdminLegacyApi } from "../../utils/admin-legacy-proxy";

export default defineEventHandler((event) =>
  fetchAdminLegacyApi(event, "/admin/messaging/stats", {
    fallbackMessage: "Unable to load message statistics",
  }),
);
