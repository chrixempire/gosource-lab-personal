import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { getProductImageUrl, getProductStockUnitRaw } from '~/lib/product-details';
import { parseInventoryTableMeta, unwrapInventoryData } from '~/lib/inventory-api';
import {
  resolveStoreCountRowStatus,
  STORE_COUNT_ROW_STATUS_LABELS,
} from '~/lib/store-count-constants';
import type { LegacyProductRow } from '~/types/inventory';
import type {
  StoreCountDetail,
  StoreCountHistoryItem,
  StoreCountHistoryListResult,
  StoreCountProductRow,
} from '~/types/store-count';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function readId(record: Record<string, unknown>) {
  const id = record._id ?? record.id;
  return id != null ? String(id) : '';
}

function formatDateLabel(value: unknown) {
  if (!value) {
    return '—';
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeLabel(value: unknown) {
  if (!value) {
    return '—';
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function mapLegacyProductToStoreCountRow(
  product: LegacyProductRow,
  countedQuantity = 0,
): StoreCountProductRow {
  const quantityLeft = Number(product.quantity ?? 0);

  return {
    id: product._id,
    name: product.name ?? '—',
    imageUrl: getProductImageUrl(product),
    marketPrice: Number(product.marketPrice ?? product.totalPrice ?? 0),
    quantityLeft,
    unit: getProductStockUnitRaw(product),
    countedQuantity,
    status: resolveStoreCountRowStatus(countedQuantity, quantityLeft),
  };
}

export function buildStoreCountRows(
  products: LegacyProductRow[],
  countedByProductId: Record<string, number>,
): StoreCountProductRow[] {
  return products.map((product) =>
    mapLegacyProductToStoreCountRow(product, countedByProductId[product._id] ?? 0),
  );
}

const STORE_COUNT_EXPORT_PAGE_SIZE = 100;

export async function fetchAllTrackableProductsForStoreCount(options?: { name?: string }) {
  const name = options?.name?.trim() || undefined;
  const products: LegacyProductRow[] = [];
  let page = 1;

  while (true) {
    const payload = await $fetch<unknown>('/api/products/filtered', {
      query: {
        page,
        limit: STORE_COUNT_EXPORT_PAGE_SIZE,
        trackQuantity: 'true',
        name,
      },
    });

    const body = unwrapInventoryData(payload);
    const batch = Array.isArray(body?.products) ? (body.products as LegacyProductRow[]) : [];
    products.push(...batch);

    const meta = parseInventoryTableMeta(body, { page, limit: STORE_COUNT_EXPORT_PAGE_SIZE });
    if (!meta.hasNext) {
      break;
    }

    page += 1;
  }

  return products;
}

function mapHistoryItem(record: Record<string, unknown>): StoreCountHistoryItem | null {
  const id = readId(record);
  if (!id) {
    return null;
  }

  const initiator = asRecord(record.initiator);
  const firstName = initiator ? String(initiator.firstName ?? '').trim() : '';
  const lastName = initiator ? String(initiator.lastName ?? '').trim() : '';
  const initiatorName = [firstName, lastName].filter(Boolean).join(' ') || 'Admin';
  const countedProducts = Array.isArray(record.countedProducts) ? record.countedProducts : [];
  const createdAt = String(record.createdAt ?? '');

  return {
    id,
    createdAt,
    createdAtLabel: formatDateLabel(createdAt),
    createdTimeLabel: formatTimeLabel(createdAt),
    initiatorName,
    productCount: countedProducts.length,
  };
}

export function parseStockCountsListResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 20,
): StoreCountHistoryListResult {
  const body = unwrapInventoryData(payload);
  const stockCounts = Array.isArray(body?.stockCounts)
    ? (body.stockCounts as Record<string, unknown>[])
    : [];

  return {
    rows: stockCounts
      .map((row) => mapHistoryItem(row))
      .filter((row): row is StoreCountHistoryItem => Boolean(row)),
    meta: parseInventoryTableMeta(body, { page: fallbackPage, limit: fallbackLimit }),
  };
}

function readProductFromCountedEntry(entry: Record<string, unknown>) {
  const product = asRecord(entry.product);
  if (product) {
    return product as LegacyProductRow;
  }

  return {
    _id: String(entry.productId ?? ''),
    name: '—',
    quantity: entry.originalQuantity,
    marketPrice: entry.price,
    purchaseUnit: entry.unit,
  } satisfies LegacyProductRow;
}

export function parseStockCountDetail(payload: unknown): StoreCountDetail | null {
  const body = unwrapInventoryData(payload);
  const record = body && (body._id || body.id) ? (body as Record<string, unknown>) : null;
  if (!record) {
    return null;
  }

  const summary = mapHistoryItem(record);
  if (!summary) {
    return null;
  }

  return {
    ...summary,
    rows: mapStockCountRecordToRows(record),
  };
}

export function mapStockCountRecordToRows(record: Record<string, unknown>): StoreCountProductRow[] {
  const countedProducts = Array.isArray(record.countedProducts)
    ? (record.countedProducts as Record<string, unknown>[])
    : [];

  return countedProducts.map((entry) => {
    const product = readProductFromCountedEntry(entry);
    const quantityLeft = Number(entry.originalQuantity ?? product.quantity ?? 0);
    const countedQuantity = Number(entry.countedQuantity ?? 0);

    return {
      id: String(entry.productId ?? product._id ?? ''),
      name: product.name ?? '—',
      imageUrl: getProductImageUrl(product),
      marketPrice: Number(entry.price ?? product.marketPrice ?? product.totalPrice ?? 0),
      quantityLeft,
      unit: String(entry.unit ?? getProductStockUnitRaw(product)),
      countedQuantity,
      status: resolveStoreCountRowStatus(countedQuantity, quantityLeft),
    };
  });
}

export function mapStockCountDetailToRows(payload: unknown): StoreCountProductRow[] {
  const body = unwrapInventoryData(payload);
  const record = body && (body._id || body.id) ? (body as Record<string, unknown>) : null;
  if (!record) {
    return [];
  }

  return mapStockCountRecordToRows(record);
}

export function buildStoreCountCsvRows(rows: StoreCountProductRow[]) {
  return rows.map((row) => ({
    'Product name': row.name,
    Amount: formatDashboardCurrency(row.marketPrice),
    'Quantity left': `${row.quantityLeft} ${row.unit}`,
    'Counted quantity': row.countedQuantity,
    Status: STORE_COUNT_ROW_STATUS_LABELS[row.status],
  }));
}
