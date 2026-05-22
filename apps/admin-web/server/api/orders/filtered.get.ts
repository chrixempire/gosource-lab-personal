import { getQuery } from 'h3';
import { fetchAdminLegacyApi } from '../../utils/admin-legacy-proxy';

function readQueryValue(query: Record<string, unknown>, key: string) {
  const value = query[key];
  if (Array.isArray(value)) {
    return value.filter((entry) => entry != null && entry !== '').map(String);
  }
  if (value == null || value === '') {
    return undefined;
  }
  return String(value);
}

function readQueryArray(query: Record<string, unknown>, key: string) {
  const value = query[key];
  if (value == null || value === '') {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  const normalized = values
    .filter((entry) => entry != null && entry !== '')
    .map((entry) => String(entry));

  return normalized.length > 0 ? normalized : undefined;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  const response = await fetchAdminLegacyApi(event, '/admin/order/filtered', {
    query: {
      page,
      limit,
      reference: readQueryValue(query, 'reference'),
      amountFrom: query.amountFrom ? Number(query.amountFrom) : undefined,
      amountTo: query.amountTo ? Number(query.amountTo) : undefined,
      business: readQueryValue(query, 'business'),
      paymentMethod: readQueryArray(query, 'paymentMethod'),
      paymentStatus: readQueryArray(query, 'paymentStatus'),
      status: readQueryArray(query, 'status'),
      startDate: readQueryValue(query, 'startDate'),
      endDate: readQueryValue(query, 'endDate'),
    },
    fallbackMessage: 'Unable to load orders',
  });

  return response;
});
