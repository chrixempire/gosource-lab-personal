import { fetchAdminLegacyApi } from "../../utils/admin-legacy-proxy";

export default defineEventHandler((event) =>
  fetchAdminLegacyApi(event, "/admin/reviews/stats", {
    fallbackMessage: "Unable to load review statistics",
  }),
);
