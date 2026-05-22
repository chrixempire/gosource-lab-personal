import * as fs from 'fs';
import * as path from 'path';
import { Cart } from '../cart/entities/cart.entity';
import { Product } from '../product/entities/product.entity';

export type OrderInvoiceLineItem = {
  no: number;
  name: string;
  qtyLabel: string;
  rate: number;
  price: number;
};

export type OrderInvoiceViewModel = {
  logoSrc: string;
  orderDate: string;
  orderTime: string;
  businessName: string;
  fullName: string;
  productCount: number;
  paymentMethod: string;
  orderReference: string;
  deliveryAddressHtml: string;
  lineItems: OrderInvoiceLineItem[];
  subtotal: number;
  marketRuns: number;
  marketRunsCouponNote: boolean;
  serviceCharge: number;
  total: number;
  formatPrice: (value: number) => string;
};

function resolveLogoSrc(): string {
  const candidates = [
    path.join(process.cwd(), 'src', 'templates', 'pdf', 'assets', 'gosource-logo.png'),
    path.join(process.cwd(), 'dist', 'templates', 'pdf', 'assets', 'gosource-logo.png'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const buffer = fs.readFileSync(candidate);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
  }

  return 'https://gosource.sfo3.cdn.digitaloceanspaces.com/Frame%201000002518.png';
}

function formatOrderDate(value?: Date | string): string {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatOrderTime(value?: Date | string): string {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

function formatPrice(value: number | undefined | null): string {
  const amount = Number(value ?? 0);
  return amount.toLocaleString('en-NG', { maximumFractionDigits: 2 });
}

function parseUnitMap(raw: string | Record<string, number> | undefined): Record<string, number> {
  if (!raw) {
    return {};
  }

  if (typeof raw === 'object') {
    return raw;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function calcUnitPrice(item: Cart): number {
  const product = item.product as Product | undefined;
  if (!product) {
    return 0;
  }

  if (product.version === 'v2') {
    const unitData = parseUnitMap(product.discountedUnit || product.unit);
    const price = unitData[item.unit];
    if (Number.isNaN(price) || price === undefined) {
      return Number(product.discountPrice ?? 0);
    }
    return Number(price);
  }

  return Number(product.discountPrice ?? 0);
}

function buildLineItems(products: Cart[] = []): OrderInvoiceLineItem[] {
  return products.map((item, index) => {
    const product = item.product as Product | undefined;
    const name = product?.name ?? 'Product';
    const quantity = Number(item.quantity ?? 0);
    const unit = item.unit ?? '';
    const rate = calcUnitPrice(item);
    const price = rate * quantity;

    let qtyLabel = unit;
    if (product?.version === 'v2') {
      qtyLabel = `${quantity} ${unit}`.trim();
    }

    return {
      no: index + 1,
      name,
      qtyLabel,
      rate,
      price,
    };
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDeliveryAddressHtml(order: any): string {
  const branch = order.branch ?? {};
  const address = order.address ?? {};
  const street = branch.streetName || address.streetAddress || '';
  const lga = branch.lga || address.lga || '';
  const state = address.state || '';

  const parts = [street, lga, state].filter(Boolean);
  if (!parts.length) {
    return '—';
  }

  return parts.map((part) => escapeHtml(String(part))).join(',<br />');
}

export function buildOrderInvoiceViewModel(order: any): OrderInvoiceViewModel {
  const products = (order.products ?? []) as Cart[];
  const deliveryFee = Number(order.deliveryFee ?? 0);
  const serviceCharge = Number(
    parseFloat(Number(order.serviceCharge ?? 0).toFixed(2)),
  );
  const totalPrice = Number(order.totalPrice ?? 0);
  const couponUsed = Boolean(order.coupon);

  const subtotal = totalPrice - serviceCharge - (couponUsed ? 0 : deliveryFee);
  const marketRuns = couponUsed ? 0 : deliveryFee;
  const total = couponUsed ? totalPrice - deliveryFee : totalPrice;

  const initiator = order.request?.initiator;
  const fullName = [initiator?.firstName, initiator?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    logoSrc: resolveLogoSrc(),
    orderDate: formatOrderDate(order.createdAt),
    orderTime: formatOrderTime(order.createdAt),
    businessName: order.business?.businessName ?? order.businessName ?? '—',
    fullName: fullName || '—',
    productCount: products.length,
    paymentMethod: order.paymentMethod ?? '—',
    orderReference: order.reference ?? String(order._id ?? '—'),
    deliveryAddressHtml: buildDeliveryAddressHtml(order),
    lineItems: buildLineItems(products),
    subtotal,
    marketRuns,
    marketRunsCouponNote: couponUsed,
    serviceCharge,
    total,
    formatPrice,
  };
}
