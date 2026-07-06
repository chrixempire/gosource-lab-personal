import { getQuery } from "h3";
import { fetchAdminLegacyApi } from "../../utils/admin-legacy-proxy";
import { readLegacyQueryValue } from "../../utils/legacy-query";

export default defineEventHandler((event) => {
  const query = getQuery(event) as Record<string, unknown>;
  return fetchAdminLegacyApi(event, "/admin/reviews", {
    query: {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 10,
      search: readLegacyQueryValue(query, "search"),
      rating: readLegacyQueryValue(query, "rating"),
    },
    fallbackMessage: "Unable to load reviews",
  });
});
