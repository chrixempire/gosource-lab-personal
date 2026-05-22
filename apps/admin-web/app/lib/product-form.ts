import { parseUnitPriceMap } from '~/lib/product-details';
import type { LegacyProductRow, ProductUnitOption } from '~/types/inventory';

export type ProductImageFormItem = {
  id?: string;
  src: string;
  file: File | null;
  /** 0–100 while staging upload; null when ready */
  uploadProgress?: number | null;
};

export type ProductPricingRow = {
  unit: string;
  price: string;
  quantityPerUnit: string;
};

export type ProductSpecialPriceRow = {
  customerId: string;
  newPrice: string;
};

export type ProductItemFormValues = {
  images: ProductImageFormItem[];
  imagesToRemove: string[];
  name: string;
  description: string;
  brand: string;
  category: string;
  trackQuantity: boolean;
  purchaseUnit: string;
  marketPrice: string;
  quantity: string;
  totalPrice: string;
  setLowStockLevel: boolean;
  stockLevel: string;
  pricing: ProductPricingRow[];
  specialPrices: ProductSpecialPriceRow[];
};

export function slugifyUnitLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, '-');
}

export function createEmptyPricingRow(): ProductPricingRow {
  return { unit: '', price: '', quantityPerUnit: '' };
}

export function createEmptySpecialPriceRow(): ProductSpecialPriceRow {
  return { customerId: '', newPrice: '' };
}

export function createEmptyProductItemFormValues(): ProductItemFormValues {
  return {
    images: [],
    imagesToRemove: [],
    name: '',
    description: '',
    brand: '',
    category: '',
    trackQuantity: true,
    purchaseUnit: '',
    marketPrice: '',
    quantity: '',
    totalPrice: '',
    setLowStockLevel: false,
    stockLevel: '',
    pricing: [createEmptyPricingRow()],
    specialPrices: [],
  };
}

export function stripToNumeric(value: string, allowDecimal: boolean) {
  const sanitized = value.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '');

  if (!allowDecimal) {
    return sanitized;
  }

  const [whole, ...decimals] = sanitized.split('.');
  const decimalPart = decimals.join('');
  return decimalPart ? `${whole}.${decimalPart.slice(0, 2)}` : whole;
}

export function formatNumericString(value: string, allowDecimal: boolean) {
  if (!value) {
    return '';
  }

  if (allowDecimal) {
    const [whole = '', decimal = ''] = value.split('.');
    const formattedWhole = Number(whole || 0).toLocaleString('en-NG');
    return decimal ? `${formattedWhole}.${decimal}` : formattedWhole;
  }

  return Number(value).toLocaleString('en-NG');
}

export function parseFormattedNumber(value: string) {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatCurrencyFieldValue(value: number | undefined | null) {
  if (value == null || !Number.isFinite(value)) {
    return '';
  }

  return formatNumericString(String(value), true);
}

export function formatIntegerFieldValue(value: number | undefined | null) {
  if (value == null || !Number.isFinite(value)) {
    return '';
  }

  return formatNumericString(String(Math.trunc(value)), false);
}

export function updateCurrencyField(
  form: ProductItemFormValues,
  field: 'marketPrice' | 'price' | 'newPrice',
  target: ProductPricingRow | ProductSpecialPriceRow | ProductItemFormValues,
  value: string,
) {
  const sanitized = stripToNumeric(value, true) || '';
  const formatted = formatNumericString(sanitized, true);

  if (field === 'marketPrice' && 'marketPrice' in target) {
    (target as ProductItemFormValues).marketPrice = formatted;
    syncComputedTotalPrice(form);
    return;
  }

  if (field === 'price' && 'price' in target) {
    (target as ProductPricingRow).price = formatted;
    return;
  }

  if (field === 'newPrice' && 'newPrice' in target) {
    (target as ProductSpecialPriceRow).newPrice = formatted;
  }
}

export function updateIntegerField(
  form: ProductItemFormValues,
  field: 'quantity' | 'quantityPerUnit' | 'stockLevel',
  target: ProductItemFormValues | ProductPricingRow,
  value: string,
) {
  const sanitized = stripToNumeric(value, false) || '';
  const formatted = formatNumericString(sanitized, false);

  if (field === 'quantity' && 'quantity' in target && !('unit' in target)) {
    (target as ProductItemFormValues).quantity = formatted;
    syncComputedTotalPrice(form);
    return;
  }

  if (field === 'stockLevel' && 'stockLevel' in target) {
    (target as ProductItemFormValues).stockLevel = formatted;
    return;
  }

  if (field === 'quantityPerUnit' && 'quantityPerUnit' in target) {
    (target as ProductPricingRow).quantityPerUnit = formatted;
  }
}

export function syncComputedTotalPrice(form: ProductItemFormValues) {
  if (!form.trackQuantity) {
    form.totalPrice = '';
    return;
  }

  const marketPrice = parseFormattedNumber(form.marketPrice) ?? 0;
  const quantity = parseFormattedNumber(form.quantity) ?? 0;
  const total = marketPrice * quantity;

  form.totalPrice = total > 0 ? formatCurrencyFieldValue(total) : '';
}

function parseNewUnitRows(value: unknown): ProductPricingRow[] {
  let parsed: unknown = value;

  if (typeof value === 'string' && value.trim()) {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = null;
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }

      const record = row as Record<string, unknown>;
      const unit = typeof record.unit === 'string' ? record.unit : '';

      if (!unit) {
        return null;
      }

      return {
        unit,
        price: formatCurrencyFieldValue(Number(record.price)),
        quantityPerUnit: formatIntegerFieldValue(
          record.quantity != null ? Number(record.quantity) : undefined,
        ),
      };
    })
    .filter((row): row is ProductPricingRow => row !== null);
}

function parsePricingFromProduct(product: LegacyProductRow): ProductPricingRow[] {
  const fromNewUnit = parseNewUnitRows((product as LegacyProductRow & { newUnit?: unknown }).newUnit);
  if (fromNewUnit.length > 0) {
    return fromNewUnit;
  }

  const unitMap = parseUnitPriceMap(product.unit);
  if (!unitMap?.length) {
    return [createEmptyPricingRow()];
  }

  return unitMap.map((entry) => ({
    unit: entry.key,
    price: formatCurrencyFieldValue(entry.price),
    quantityPerUnit: '',
  }));
}

function parseSpecialPricesFromProduct(product: LegacyProductRow): ProductSpecialPriceRow[] {
  const raw = (product as LegacyProductRow & { specialPrices?: unknown }).specialPrices;

  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const record = entry as Record<string, unknown>;
        const customerId =
          typeof record.customerId === 'string'
            ? record.customerId
            : typeof record.businessId === 'string'
              ? record.businessId
              : typeof record.key === 'string'
                ? record.key
                : '';

        const priceValue = record.price ?? record.value;
        const price =
          typeof priceValue === 'number'
            ? priceValue
            : typeof priceValue === 'string'
              ? Number(priceValue)
              : undefined;

        if (!customerId) {
          return null;
        }

        return {
          customerId,
          newPrice: formatCurrencyFieldValue(price),
        };
      })
      .filter((row): row is ProductSpecialPriceRow => row !== null);
  }

  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([customerId, priceValue]) => ({
      customerId,
      newPrice: formatCurrencyFieldValue(Number(priceValue)),
    }));
  }

  return [];
}

/** Maps API `purchaseUnit` (or label) to a unit option slug for selects. */
export function resolveProductStockUnit(rawUnit: string, unitOptions: ProductUnitOption[]) {
  const purchaseUnit = rawUnit.trim();
  if (!purchaseUnit) {
    return '';
  }

  const normalized = purchaseUnit.toLowerCase();
  const match = unitOptions.find(
    (option) =>
      option.slug === normalized ||
      option.slug === purchaseUnit ||
      option.label.toLowerCase() === normalized,
  );

  return match?.slug ?? normalized;
}

export function resolvePurchaseUnitSlug(product: LegacyProductRow, unitOptions: ProductUnitOption[]) {
  const fromPurchase = resolveProductStockUnit(product.purchaseUnit ?? '', unitOptions);
  if (fromPurchase) {
    return fromPurchase;
  }

  const pricing = parsePricingFromProduct(product);
  return pricing[0]?.unit ?? '';
}

export function mapLegacyProductToFormValues(
  product: LegacyProductRow,
  unitOptions: ProductUnitOption[],
): ProductItemFormValues {
  const categoryRecord =
    product.category && typeof product.category === 'object' ? product.category : null;

  const images: ProductImageFormItem[] = (product.images ?? [])
    .map((image): ProductImageFormItem | null => {
      const url = typeof image?.url === 'string' ? image.url : '';
      const id = typeof (image as { id?: string }).id === 'string' ? (image as { id: string }).id : undefined;

      if (!url) {
        return null;
      }

      return {
        ...(id ? { id } : {}),
        src: url,
        file: null,
      };
    })
    .filter((row): row is ProductImageFormItem => row !== null);

  const form = createEmptyProductItemFormValues();

  Object.assign(form, {
    images,
    imagesToRemove: [],
    name: product.name?.trim() ?? '',
    description: product.description?.trim() ?? '',
    brand: product.brand?.trim() ?? '',
    category: categoryRecord?._id ?? (typeof product.category === 'string' ? product.category : ''),
    trackQuantity: product.trackQuantity !== false,
    purchaseUnit: resolvePurchaseUnitSlug(product, unitOptions),
    marketPrice: formatCurrencyFieldValue(product.marketPrice),
    quantity: formatIntegerFieldValue(product.quantity),
    totalPrice: formatCurrencyFieldValue(product.totalPrice ?? product.marketPrice),
    setLowStockLevel: product.isLowStock === true,
    stockLevel: formatIntegerFieldValue(
      product.lowStockLevel != null ? Number(product.lowStockLevel) : undefined,
    ),
    pricing: parsePricingFromProduct(product),
    specialPrices: parseSpecialPricesFromProduct(product),
  });

  syncComputedTotalPrice(form);

  return form;
}

export function validateProductItemForm(
  form: ProductItemFormValues,
  options?: { isEdit?: boolean },
) {
  const isEdit = options?.isEdit === true;
  const fieldErrors: Record<string, string> = {};

  const hasPersistedImage = form.images.some((image) => image.id);
  const hasNewImageFile = form.images.some((image) => image.file instanceof File);

  if (!hasPersistedImage && !hasNewImageFile) {
    fieldErrors.images = 'At least one image is required';
  }

  if (form.images.length > 4) {
    fieldErrors.images = 'You can upload up to 4 images';
  }

  if (!form.name.trim()) {
    fieldErrors.name = 'Name is required';
  }

  if (!form.description.trim()) {
    fieldErrors.description = 'Description is required';
  }

  if (!form.category) {
    fieldErrors.category = 'Category is required';
  }

  const marketPrice = parseFormattedNumber(form.marketPrice);
  if (marketPrice == null) {
    fieldErrors.marketPrice = 'Market price is required';
  }

  if (form.pricing.length === 0) {
    fieldErrors.pricing = 'At least one pricing row is required';
  }

  form.pricing.forEach((row, index) => {
    if (!row.unit.trim()) {
      fieldErrors[`pricing.${index}.unit`] = 'Unit is required';
    }

    if (parseFormattedNumber(row.price) == null) {
      fieldErrors[`pricing.${index}.price`] = 'Price per unit is required';
    }

    if (form.trackQuantity && parseFormattedNumber(row.quantityPerUnit) == null) {
      fieldErrors[`pricing.${index}.quantityPerUnit`] = 'Quantity per unit is required';
    }
  });

  if (form.trackQuantity) {
    if (!form.purchaseUnit) {
      fieldErrors.purchaseUnit = 'Unit is required when tracking quantity';
    }

    if (!isEdit && parseFormattedNumber(form.quantity) == null) {
      fieldErrors.quantity = 'Quantity is required';
    }

    if (!isEdit && parseFormattedNumber(form.totalPrice) == null) {
      fieldErrors.totalPrice = 'Total price is required';
    }
  }

  if (form.setLowStockLevel && parseFormattedNumber(form.stockLevel) == null) {
    fieldErrors.stockLevel = 'Low stock level is required';
  }

  form.specialPrices.forEach((row, index) => {
    const hasCustomer = Boolean(row.customerId);
    const hasPrice = parseFormattedNumber(row.newPrice) != null;

    if (!hasCustomer && !hasPrice) {
      return;
    }

    if (!hasCustomer) {
      fieldErrors[`specialPrices.${index}.customerId`] = 'Customer is required';
    }

    if (!hasPrice) {
      fieldErrors[`specialPrices.${index}.newPrice`] = 'New price is required';
    }
  });

  return fieldErrors;
}

/** Remove validation messages for fields that now pass (e.g. after the user edits). */
export function clearResolvedProductItemFieldErrors(
  form: ProductItemFormValues,
  fieldErrors: Record<string, string>,
  options?: { isEdit?: boolean },
) {
  const latest = validateProductItemForm(form, options);

  for (const key of Object.keys(fieldErrors)) {
    if (!(key in latest)) {
      delete fieldErrors[key];
    }
  }
}

export function buildProductItemFormData(form: ProductItemFormValues, options?: { isEdit?: boolean }) {
  const isEdit = options?.isEdit === true;
  const formData = new FormData();

  formData.append('name', form.name.trim());
  formData.append('description', form.description.trim());
  formData.append('trackQuantity', String(form.trackQuantity));
  formData.append('category', form.category);

  if (form.purchaseUnit) {
    formData.append('purchaseUnit', form.purchaseUnit.toLowerCase());
  }

  if (form.brand.trim()) {
    formData.append('brand', form.brand.trim());
  }

  const marketPrice = parseFormattedNumber(form.marketPrice);
  if (marketPrice != null) {
    formData.append('marketPrice', String(marketPrice));
  }

  if (form.trackQuantity) {
    const quantity = parseFormattedNumber(form.quantity);
    const totalPrice = parseFormattedNumber(form.totalPrice);

    if (quantity != null) {
      formData.append('quantity', String(quantity));
    }

    if (totalPrice != null) {
      formData.append('totalPrice', String(totalPrice));
    }

    formData.append('isLowStock', String(form.setLowStockLevel));

    const stockLevel = parseFormattedNumber(form.stockLevel);
    if (form.setLowStockLevel && stockLevel != null) {
      formData.append('lowStockLevel', String(stockLevel));
    }
  }

  if (form.pricing.length > 0) {
    const formattedPrice: Record<string, number> = {};

    form.pricing.forEach((row) => {
      const key = row.unit.trim().toLowerCase();
      const price = parseFormattedNumber(row.price);
      if (key && price != null) {
        formattedPrice[key] = price;
      }
    });

    formData.append('unit', JSON.stringify(formattedPrice));

    const newUnit = form.pricing.map((row) => ({
      unit: row.unit.trim(),
      price: parseFormattedNumber(row.price),
      quantity: form.trackQuantity ? parseFormattedNumber(row.quantityPerUnit) : null,
    }));

    formData.append('newUnit', JSON.stringify(newUnit));
  }

  const specialRows = form.specialPrices
    .filter((row) => row.customerId && parseFormattedNumber(row.newPrice) != null)
    .map((row) => ({
      businessId: row.customerId,
      price: parseFormattedNumber(row.newPrice),
    }));

  if (specialRows.length > 0) {
    formData.append('specialPrices', JSON.stringify(specialRows));
  }

  if (isEdit && form.imagesToRemove.length > 0) {
    formData.append('imagesToRemove', JSON.stringify(form.imagesToRemove));
  }

  form.images.forEach((image) => {
    if (image.file instanceof File) {
      formData.append('images', image.file);
    }
  });

  return formData;
}

export const PRODUCT_ITEM_INPUT_CLASS =
  'shadow-none focus:ring-0 focus-visible:ring-0';

export const PRODUCT_ITEM_TEXTAREA_CLASS =
  'flex min-h-[132px] w-full rounded-[10px] border border-border-input-default bg-grey-55 px-4 py-3 text-[14px] text-grey-900 shadow-none outline-none transition placeholder:text-grey-400 focus:border-border-input-active disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100';

export const PRODUCT_ITEM_SELECT_TRIGGER_CLASS =
  'flex h-10 w-full items-center justify-between rounded-[10px] border border-border-input-default bg-grey-55 px-4 text-left text-[14px] text-grey-900 shadow-none outline-none transition hover:border-border-input-active focus-visible:border-border-input-active disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100';
