import { fetchAdminLegacyApi } from "../../utils/admin-legacy-proxy";

export default defineEventHandler((event) =>
  fetchAdminLegacyApi(event, "/admin/feedback/stats", {
    fallbackMessage: "Unable to load feedback statistics",
  }),
);
