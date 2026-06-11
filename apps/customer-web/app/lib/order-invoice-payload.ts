import type { OrderDetailRecord } from '@gosource/api-client';

export type InvoiceOrderProductLine = {
  quantity: number;
  unit: string;
  product: {
    _id: string;
    name: string;
    version: 'v2';
    discountPrice: number;
    unit: string;
    discountedUnit?: string;
  };
};

export type InvoiceOrderPayload = {
  createdAt: string;
  business: { businessName: string };
  branch: { branchName: string; streetName?: string; lga?: string };
  request: {
    initiator: {
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  };
  products: InvoiceOrderProductLine[];
  paymentMethod: string | null;
  reference: string;
  address: OrderDetailRecord['address'];
  totalPrice: number;
  serviceCharge: number;
  deliveryFee: number;
  coupon?: unknown;
};

export function mapOrderDetailToInvoicePayload(
  order: OrderDetailRecord,
  businessName: string,
): InvoiceOrderPayload {
  const products = (Array.isArray(order.products) ? order.products : []).map((line, index) => {
    const unit = (line.unit ?? 'unit').trim() || 'unit';
    const unitPrice = Number.isFinite(line.unitPrice) ? line.unitPrice : 0;

    return {
      quantity: line.quantity,
      unit,
      product: {
        _id: line.productId ?? `${line.productName}-${index}`,
        name: line.productName,
        version: 'v2' as const,
        discountPrice: unitPrice,
        unit: JSON.stringify({ [unit]: unitPrice }),
      },
    };
  });

  return {
    createdAt: order.createdAt,
    business: { businessName: businessName || order.branchName || '—' },
    branch: { branchName: order.branchName },
    request: { initiator: order.initiator },
    products,
    paymentMethod: order.paymentMethod,
    reference: order.reference,
    address: order.address,
    totalPrice: order.totalPrice,
    serviceCharge: order.serviceCharge,
    deliveryFee: order.deliveryFee,
  };
}

export function buildInvoiceFileName(order: OrderDetailRecord, businessName: string) {
  let fileName = `${businessName || order.branchName}-ref-${order.reference}`;
  return fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}
