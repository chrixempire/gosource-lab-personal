import type { RequestProductRecord, RequestRecord } from '@gosource/api-client';
import { resolveBillableDiscount } from '~/lib/request-pricing';

export function cloneRequestRecord(request: RequestRecord): RequestRecord {
  return {
    ...request,
    initiator: { ...request.initiator },
    address: { ...request.address },
    products: request.products.map((product) => ({ ...product })),
  };
}

export function recomputeRequestTotals(request: RequestRecord): RequestRecord {
  const products = request.products.map((product) => ({
    ...product,
    totalPrice: Math.round(product.unitPrice * product.quantity),
  }));

  const subtotal = products.reduce((sum, product) => sum + product.totalPrice, 0);
  const totalPrice =
    subtotal +
    request.deliveryFee +
    request.serviceCharge -
    resolveBillableDiscount(request);

  return {
    ...request,
    products,
    subtotal,
    totalPrice,
  };
}

export function applyDraftLineQuantity(
  request: RequestRecord,
  cartLineId: string,
  quantity: number,
): RequestRecord {
  const nextQuantity = Math.max(1, quantity);
  const products = request.products.map((product) => {
    if (product.cartLineId !== cartLineId) {
      return product;
    }

    return {
      ...product,
      quantity: nextQuantity,
      totalPrice: Math.round(product.unitPrice * nextQuantity),
    };
  });

  return recomputeRequestTotals({ ...request, products });
}

export function removeDraftLine(request: RequestRecord, cartLineId: string): RequestRecord {
  const products = request.products.filter((product) => product.cartLineId !== cartLineId);
  return recomputeRequestTotals({ ...request, products });
}

export type DraftRequestProductInput = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  imageUrl?: string | null;
  inStock?: boolean;
};

function normalizeUnit(unit: string | null | undefined) {
  return (unit ?? 'Standard pack').trim();
}

export function upsertDraftLineByProductUnit(
  request: RequestRecord,
  input: DraftRequestProductInput,
): RequestRecord {
  const nextQuantity = Math.max(1, input.quantity);
  const normalizedUnit = normalizeUnit(input.unit);
  const existingIndex = request.products.findIndex(
    (product) =>
      product.productId === input.productId &&
      normalizeUnit(product.unit) === normalizedUnit,
  );

  const nextLine: RequestProductRecord = {
    ...(existingIndex >= 0 ? request.products[existingIndex] : {}),
    productId: input.productId,
    productName: input.productName,
    quantity: nextQuantity,
    unitPrice: input.unitPrice,
    totalPrice: Math.round(input.unitPrice * nextQuantity),
    unit: normalizedUnit,
    imageUrl: input.imageUrl ?? null,
    inStock: input.inStock ?? true,
  };

  const products = [...request.products];
  if (existingIndex >= 0) {
    products[existingIndex] = nextLine;
  } else {
    products.push(nextLine);
  }

  return recomputeRequestTotals({ ...request, products });
}

export function removeDraftLineByProductUnit(
  request: RequestRecord,
  productId: string,
  unit: string,
): RequestRecord {
  const normalizedUnit = normalizeUnit(unit);
  const products = request.products.filter(
    (product) =>
      !(
        product.productId === productId &&
        normalizeUnit(product.unit) === normalizedUnit
      ),
  );

  return recomputeRequestTotals({ ...request, products });
}

export type RequestProductLinePatch = {
  cartLineId: string;
  quantity: number;
};

export type RequestProductLineAddition = {
  productId: string;
  quantity: number;
  unit: string;
};

export function diffRequestProductEdits(
  baseline: RequestRecord,
  draft: RequestRecord,
): {
  removedLineIds: string[];
  quantityPatches: RequestProductLinePatch[];
  addedLines: RequestProductLineAddition[];
} {
  const draftById = new Map(
    draft.products
      .filter((product): product is RequestProductRecord & { cartLineId: string } =>
        Boolean(product.cartLineId),
      )
      .map((product) => [product.cartLineId, product]),
  );

  const removedLineIds: string[] = [];
  const quantityPatches: RequestProductLinePatch[] = [];
  const addedLines: RequestProductLineAddition[] = [];

  for (const product of baseline.products) {
    if (!product.cartLineId) {
      continue;
    }

    const draftLine = draftById.get(product.cartLineId);
    if (!draftLine) {
      removedLineIds.push(product.cartLineId);
      continue;
    }

    if (draftLine.quantity !== product.quantity) {
      quantityPatches.push({
        cartLineId: product.cartLineId,
        quantity: draftLine.quantity,
      });
    }
  }

  for (const product of draft.products) {
    if (product.cartLineId || !product.productId) {
      continue;
    }

    addedLines.push({
      productId: product.productId,
      quantity: product.quantity,
      unit: normalizeUnit(product.unit),
    });
  }

  return { removedLineIds, quantityPatches, addedLines };
}

export function hasRequestProductDraftChanges(
  baseline: RequestRecord | null,
  draft: RequestRecord | null,
): boolean {
  if (!baseline || !draft) {
    return false;
  }

  const { removedLineIds, quantityPatches, addedLines } = diffRequestProductEdits(
    baseline,
    draft,
  );
  return (
    removedLineIds.length > 0 ||
    quantityPatches.length > 0 ||
    addedLines.length > 0
  );
}
