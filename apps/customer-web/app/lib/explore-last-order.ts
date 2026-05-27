import type { OrderProductRecord, OrderRecord } from '@gosource/api-client';
import type { MarketProduct } from '~/lib/marketplace-data';
import { getMarketProductById, registerMarketProduct } from '~/lib/marketplace-data';

export const EXPLORE_ORDER_AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#166534' },
  { bg: '#FEF9C3', text: '#92400E' },
  { bg: '#FCE7F3', text: '#BE123C' },
  { bg: '#EDE9FE', text: '#6D28D9' },
] as const;

export const EXPLORE_LAST_ORDER_AVATAR_LIMIT = 5;

export type ExploreLastOrderDraftLine = {
  key: string;
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  inStock: boolean;
  product?: MarketProduct;
};

export function orderLineAvatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export function orderLineAvatarColor(index: number) {
  return EXPLORE_ORDER_AVATAR_COLORS[index % EXPLORE_ORDER_AVATAR_COLORS.length]!;
}

export function formatExploreOrderDateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function sanitizeOrderUnitLabel(unit: string | null | undefined) {
  const trimmed = unit?.trim() ?? '';
  if (!trimmed || /^undefined$/i.test(trimmed)) {
    return '';
  }

  return trimmed;
}

function catalogProductFromOrderLine(line: OrderProductRecord): MarketProduct | undefined {
  if (!line.productId) {
    return undefined;
  }

  const existing = getMarketProductById(line.productId);
  if (existing) {
    return existing;
  }

  const unit = sanitizeOrderUnitLabel(line.unit) || 'Standard pack';
  const product: MarketProduct = {
    id: line.productId,
    name: line.productName,
    description: '',
    imageUrl: line.imageUrl ?? undefined,
    priceNaira: line.unitPrice,
    unit,
    inStock: line.inStock !== false,
  };

  registerMarketProduct(product);
  return product;
}

export function buildExploreLastOrderDraftLines(order: OrderRecord): ExploreLastOrderDraftLine[] {
  return (order.products ?? [])
    .filter((line) => line.productId && line.quantity > 0)
    .map((line, index) => {
      const productId = line.productId!;
      const unit = sanitizeOrderUnitLabel(line.unit) || 'Standard pack';

      return {
        key: `${productId}:${unit}:${index}`,
        productId,
        productName: line.productName,
        unit,
        unitPrice: line.unitPrice,
        imageUrl: line.imageUrl ?? null,
        quantity: line.quantity,
        inStock: line.inStock !== false,
        product: catalogProductFromOrderLine(line),
      };
    });
}

export function visibleOrderAvatarLines(lines: ExploreLastOrderDraftLine[]) {
  return lines.slice(0, EXPLORE_LAST_ORDER_AVATAR_LIMIT);
}

export function remainingOrderAvatarCount(lines: ExploreLastOrderDraftLine[]) {
  return Math.max(0, lines.length - EXPLORE_LAST_ORDER_AVATAR_LIMIT);
}

export function draftLinesSubtotal(lines: ExploreLastOrderDraftLine[]) {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}
