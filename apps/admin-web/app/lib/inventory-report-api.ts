import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import { isProductLowStock } from '~/lib/product-details';
import type {
  InventoryMovementListResult,
  InventoryMovementRow,
  InventoryMovementSummary,
} from '~/types/inventory-report';
import type { InventoryTableMeta } from '~/types/inventory';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

const EMPTY_SUMMARY: InventoryMovementSummary = {
  totalOpeningQuantity: 0,
  totalAddedQuantity: 0,
  totalDeductedQuantity: 0,
  totalClosingQuantity: 0,
  totalProducts: 0,
  totalLowStockItems: 0,
};

function mapMovementRow(record: Record<string, unknown>): InventoryMovementRow | null {
  const id = record.productId ?? record._id ?? record.id;
  if (id == null || id === '') {
    return null;
  }

  return {
    id: String(id),
    productName: String(record.productName ?? record.name ?? '—'),
    unit: String(record.unit ?? record.purchaseUnit ?? 'unit'),
    openingQuantity: Number(record.openingQuantity ?? 0),
    addedQuantity: Number(record.addedQuantity ?? 0),
    deductedQuantity: Number(record.deductedQuantity ?? 0),
    closingQuantity: Number(record.closingQuantity ?? 0),
    isLowStock: isProductLowStock({
      trackQuantity: record.trackQuantity !== false,
      quantity: Number(record.closingQuantity ?? 0),
      lowStockLevel:
        record.lowStockLevel != null ? Number(record.lowStockLevel) : undefined,
    }),
  };
}

function parseMovementMeta(
  pagination: Record<string, unknown> | null,
  fallback: { page: number; limit: number },
): InventoryTableMeta {
  const page = Number(pagination?.currentPage) || fallback.page;
  const limit = Number(pagination?.itemsPerPage) || fallback.limit;
  const total = Number(pagination?.totalItems) || 0;
  const totalPages = Math.max(1, Number(pagination?.totalPages) || Math.ceil(total / limit) || 1);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: pagination?.hasNextPage === true || page < totalPages,
    hasPrev: pagination?.hasPreviousPage === true || page > 1,
  };
}

function parseMovementSummary(summary: Record<string, unknown> | null): InventoryMovementSummary {
  if (!summary) {
    return EMPTY_SUMMARY;
  }

  return {
    totalOpeningQuantity: Number(summary.totalOpeningQuantity ?? 0),
    totalAddedQuantity: Number(summary.totalAddedQuantity ?? 0),
    totalDeductedQuantity: Number(summary.totalDeductedQuantity ?? 0),
    totalClosingQuantity: Number(summary.totalClosingQuantity ?? 0),
    totalProducts: Number(summary.totalProducts ?? 0),
    totalLowStockItems: Number(summary.totalLowStockItems ?? 0),
  };
}

export function parseInventoryMovementResponse(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 10,
): InventoryMovementListResult {
  const body = unwrapLegacyPayload(payload) ?? asRecord(payload);
  const rows = Array.isArray(body?.data)
    ? (body.data as Record<string, unknown>[])
        .map((row) => mapMovementRow(row))
        .filter((row): row is InventoryMovementRow => Boolean(row))
    : [];

  return {
    rows,
    meta: parseMovementMeta(asRecord(body?.pagination), {
      page: fallbackPage,
      limit: fallbackLimit,
    }),
    summary: parseMovementSummary(asRecord(body?.summary)),
  };
}

export function buildInventoryReportCsvRows(rows: InventoryMovementRow[]) {
  return rows.map((row) => ({
    'Product name': row.productName,
    Unit: row.unit,
    'Opening quantity': row.openingQuantity,
    'Added quantity': row.addedQuantity,
    'Sold/deducted quantity': row.deductedQuantity,
    'Closing quantity': row.closingQuantity,
    'Low stock': row.isLowStock ? 'Yes' : 'No',
  }));
}

const INVENTORY_REPORT_EXPORT_PAGE_SIZE = 100;

export type InventoryMovementFetchQuery = {
  filterType: string;
  startDate?: string;
  endDate?: string;
  search?: string;
};

export async function fetchAllInventoryMovementRows(query: InventoryMovementFetchQuery) {
  const rows: InventoryMovementRow[] = [];
  let page = 1;

  while (true) {
    const payload = await $fetch<unknown>('/api/products/inventory-movement', {
      query: {
        ...query,
        page,
        limit: INVENTORY_REPORT_EXPORT_PAGE_SIZE,
      },
    });

    const parsed = parseInventoryMovementResponse(
      payload,
      page,
      INVENTORY_REPORT_EXPORT_PAGE_SIZE,
    );
    rows.push(...parsed.rows);

    if (!parsed.meta.hasNext) {
      break;
    }

    page += 1;
  }

  return rows;
}
