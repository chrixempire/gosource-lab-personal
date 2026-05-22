import { parseFormattedNumber } from '~/lib/product-form';

export type ProductAddStockFormValues = {
  unit: string;
  marketPrice: string;
  quantity: string;
};

export type ProductRemoveStockFormValues = {
  unit: string;
  quantity: string;
  reason: string;
};

export function createEmptyAddStockForm(unit = '', marketPrice = ''): ProductAddStockFormValues {
  return {
    unit,
    marketPrice,
    quantity: '',
  };
}

export function createEmptyRemoveStockForm(unit = ''): ProductRemoveStockFormValues {
  return {
    unit,
    quantity: '',
    reason: '',
  };
}

export function computeAddStockTotalPrice(marketPrice: string, quantity: string) {
  const unitPrice = parseFormattedNumber(marketPrice);
  const qty = parseFormattedNumber(quantity);

  if (unitPrice == null || qty == null) {
    return '';
  }

  return String(unitPrice * qty);
}

export function validateAddStockForm(form: ProductAddStockFormValues) {
  const fieldErrors: Record<string, string> = {};

  if (!form.unit.trim()) {
    fieldErrors.unit = 'Unit is required';
  }

  const marketPrice = parseFormattedNumber(form.marketPrice);
  if (marketPrice == null) {
    fieldErrors.marketPrice = 'Market price is required';
  }

  const quantity = parseFormattedNumber(form.quantity);
  if (quantity == null || quantity <= 0) {
    fieldErrors.quantity = 'Quantity is required';
  }

  return fieldErrors;
}

export function validateRemoveStockForm(form: ProductRemoveStockFormValues) {
  const fieldErrors: Record<string, string> = {};

  if (!form.unit.trim()) {
    fieldErrors.unit = 'Please set unit';
  }

  const quantity = parseFormattedNumber(form.quantity);
  if (quantity == null || quantity <= 0) {
    fieldErrors.quantity = 'Quantity is required';
  }

  if (!form.reason.trim()) {
    fieldErrors.reason = 'Please provide a reason for the deduction';
  }

  return fieldErrors;
}

export function buildAddStockBody(form: ProductAddStockFormValues) {
  const unitPrice = parseFormattedNumber(form.marketPrice);
  const quantity = parseFormattedNumber(form.quantity);

  return {
    unitPrice: unitPrice ?? 0,
    unit: form.unit.trim().toLowerCase(),
    quantity: quantity ?? 0,
  };
}

export function buildRemoveStockBody(form: ProductRemoveStockFormValues) {
  const quantity = parseFormattedNumber(form.quantity);

  return {
    unit: form.unit.trim().toLowerCase(),
    quantity: quantity ?? 0,
    deductReason: form.reason.trim(),
  };
}
