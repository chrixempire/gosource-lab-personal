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

  return fetchAdminLegacyApi(event, '/admin/product/filtered', {
    query: {
      page,
      limit,
      name: readQueryValue(query, 'name'),
      category: readQueryArray(query, 'category'),
      productStatus: readQueryArray(query, 'productStatus'),
      inStock: (() => {
        const value = readQueryValue(query, 'inStock');
        if (value === 'true') {
          return true;
        }
        if (value === 'false') {
          return false;
        }
        return undefined;
      })(),
      trackQuantity: (() => {
        const value = readQueryValue(query, 'trackQuantity');
        if (value === 'true') {
          return true;
        }
        if (value === 'false') {
          return false;
        }
        return undefined;
      })(),
    },
    fallbackMessage: 'Unable to load products',
  });
});
