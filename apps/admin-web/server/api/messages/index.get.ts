import { getQuery } from "h3";
import { fetchAdminLegacyApi } from "../../utils/admin-legacy-proxy";
import { readLegacyQueryValue } from "../../utils/legacy-query";

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  return fetchAdminLegacyApi(event, "/admin/messaging", {
    query: {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 10,
      search: readLegacyQueryValue(query, "search"),
      type: readLegacyQueryValue(query, "type"),
      status: readLegacyQueryValue(query, "status"),
      sortBy: readLegacyQueryValue(query, "sortBy"),
      sortOrder: readLegacyQueryValue(query, "sortOrder"),
    },
    fallbackMessage: "Unable to load messages",
  });
});
