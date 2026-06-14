import type {
  BranchDeleteResponse,
  BranchListResponse,
  BranchMemberRecord,
  BranchMembersResponse,
  BranchRecord,
  BranchResponse,
  CancelEmployeeInviteResponse,
  EmployeeDeleteResponse,
  EmployeeInvitationResponse,
  EmployeeInviteResponse,
  EmployeeMemberDetail,
  EmployeeMemberResponse,
  VerifyBvnResponse,
  WalletRecord,
  WalletResponse,
  WalletTransactionRecord,
  WalletTransactionsResponse,
  RequestActorRecord,
  RequestListResponse,
  RequestProductRecord,
  RequestRecord,
  RequestResponse,
  OrderDetailRecord,
  OrderListResponse,
  OrderPaymentStatus,
  OrderRecord,
  OrderResponse,
  OrderStatus,
  OrderTimelineRecord,
  OrderTimelineResponse,
  ShoppingListItemRecord,
  ShoppingListListResponse,
  ShoppingListMoveResponse,
  ShoppingListRecord,
  ShoppingListResponse,
} from '@gosource/api-client';
import type {
  MarketCartItem,
  MarketCartMutationResponse,
  MarketCartResponse,
  MarketCategoriesResponse,
  MarketCategory,
  MarketCategoryResponse,
  MarketProduct,
  MarketProductResponse,
  MarketPromotion,
  MarketPromotionsResponse,
  MarketRecentOrdersResponse,
} from '../../app/lib/marketplace-data';
import { cartLineKey, getMarketUnitPrice, getMeasureShortHand } from '../../app/lib/marketplace-data';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asRecord(value: unknown) {
  return isRecord(value) ? value : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function toStringValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (isRecord(value) && typeof value._id === 'string') {
    return value._id;
  }

  if (isRecord(value) && typeof value.$oid === 'string') {
    return value.$oid;
  }

  if (isRecord(value) && typeof value.id === 'string') {
    return value.id;
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { toString?: () => string }).toString === 'function'
  ) {
    const next = (value as { toString: () => string }).toString();
    if (next && next !== '[object Object]') {
      return next;
    }
  }

  return '';
}

function toNullableString(value: unknown) {
  const next = toStringValue(value).trim();
  return next || null;
}

function toBoolean(value: unknown) {
  return Boolean(value);
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no'].includes(normalized)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return undefined;
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

const INVALID_IMAGE_URL_LITERALS = new Set(['null', 'undefined', '[object object]']);

function isValidAbsoluteImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || INVALID_IMAGE_URL_LITERALS.has(trimmed.toLowerCase())) {
    return false;
  }

  if (trimmed.includes('[object Object]')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function coerceImageUrlCandidate(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return isValidAbsoluteImageUrl(trimmed) ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = coerceImageUrlCandidate(item);
      if (nested) {
        return nested;
      }
    }
    return undefined;
  }

  if (isRecord(value)) {
    const candidates = [value.secure_url, value.url, value.location, value.src, value.path];
    for (const candidate of candidates) {
      const nested = coerceImageUrlCandidate(candidate);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function withImageCacheBust(url: string, image: unknown) {
  if (!isRecord(image)) {
    return url;
  }

  const version =
    toStringValue(image.id) ||
    toStringValue(image.updatedAt) ||
    toStringValue(image.createdAt);

  if (!version) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function firstImageUrl(value: unknown) {
  const images = Array.isArray(value) ? value : value != null ? [value] : [];

  for (const image of images) {
    const url = coerceImageUrlCandidate(image);
    if (url) {
      return withImageCacheBust(url, image);
    }
  }

  return undefined;
}

function parseUnitPriceMap(value: unknown): [string, number][] | null {
  let parsed: Record<string, unknown> | null = null;

  if (isRecord(value)) {
    parsed = value;
  } else {
    const raw = toStringValue(value).trim();
    if (!raw) {
      return null;
    }

    try {
      const next = JSON.parse(raw) as unknown;
      if (isRecord(next)) {
        parsed = next;
      }
    } catch {
      const fallbackEntries = Array.from(
        raw.matchAll(/"?([A-Za-z][A-Za-z\s-]*)"?\s*:\s*"?(\d+(?:\.\d+)?)"?/g),
      )
        .map(([, key = '', amount = '']) => [normalizeUnitKey(key), Number(amount)] as [string, number])
        .filter(([, parsedAmount]) => Number.isFinite(parsedAmount) && parsedAmount > 0);

      return fallbackEntries.length ? fallbackEntries : null;
    }
  }

  if (!parsed) {
    return null;
  }

  const entries = Object.entries(parsed)
    .map(([key, entryValue]) => [normalizeUnitKey(key), toNumber(entryValue)] as [string, number])
    .filter(([, amount]) => amount > 0);

  return entries.length ? entries : null;
}

function lookupUnitMapPrice(entries: [string, number][] | null, unit: string) {
  if (!entries?.length || !unit.trim()) {
    return undefined;
  }

  const normalized = normalizeUnitKey(unit);
  return entries.find(([key]) => key === normalized)?.[1];
}

function isLikelyUnitPriceMap(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('{') || trimmed.includes('":');
}

function hasLegacyProductPricing(product: Record<string, unknown>) {
  return (
    toNumber(product.discountPrice) > 0 ||
    toNumber(product.marketPrice) > 0 ||
    toNumber(product.actualPrice) > 0 ||
    parseUnitPriceMap(product.discountedUnit) !== null ||
    parseUnitPriceMap(product.unit) !== null
  );
}

function resolveRequestLineUnit(item: Record<string, unknown>, product: Record<string, unknown>) {
  const fromItem = toStringValue(item.unit);
  if (fromItem && !isLikelyUnitPriceMap(fromItem)) {
    return fromItem;
  }

  for (const candidate of [product.purchaseUnit, product.newUnit]) {
    const next = toStringValue(candidate);
    if (next && !isLikelyUnitPriceMap(next)) {
      return next;
    }
  }

  const unitMap =
    parseUnitPriceMap(product.discountedUnit) ?? parseUnitPriceMap(product.unit);
  if (unitMap?.length === 1) {
    return unitMap[0]?.[0] ?? 'Standard pack';
  }

  return fromItem && !isLikelyUnitPriceMap(fromItem) ? fromItem : 'Standard pack';
}

function calculateLegacyRequestLineTotal(
  item: Record<string, unknown>,
  product: Record<string, unknown>,
  businessId?: string,
) {
  const quantity = Math.max(0, toNumber(item.quantity));
  if (!quantity) {
    return 0;
  }

  const unit = resolveRequestLineUnit(item, product);
  const version = toStringValue(product.version);

  if (version === 'v2') {
    const unitMap =
      parseUnitPriceMap(product.discountedUnit) ?? parseUnitPriceMap(product.unit);
    const unitPrice = lookupUnitMapPrice(unitMap, unit);
    if (typeof unitPrice === 'number' && unitPrice > 0) {
      return unitPrice * quantity;
    }

    return toNumber(product.discountPrice) * quantity;
  }

  const pricingBusinessId = businessId ?? '';
  const specialPrice = asArray(product.specialPrices).find((entry) => {
    const record = asRecord(entry);
    return toStringValue(record.customerId) === pricingBusinessId;
  });
  const special = asRecord(specialPrice);
  const price =
    special.price !== undefined ? toNumber(special.price) : toNumber(product.discountPrice);

  return price * quantity;
}

function normalizeUnitKey(value: string) {
  return value.trim().toLowerCase();
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeEmployeeRole(value: unknown) {
  const role = toStringValue(value).toLowerCase();
  if (role === 'admin') {
    return 'manager';
  }
  return role || 'employee';
}

const categoryEmojiMap: Record<string, string> = {
  'fruits-and-vegetables': '🍎',
  'frozen-foods': '🧊',
  frozen: '🧊',
  'canned-foods': '🥫',
  'spices-and-seasonings': '🧂',
  oils: '🫒',
  'packaging-materials': '📦',
  'dairy-and-eggs': '🥚',
  'paperware-and-disposables': '🧻',
  stationery: '✏️',
  sauces: '🍅',
  utensils: '🥄',
  'dry-foods': '🍚',
  'dry-fish': '🐟',
  drinks: '🥤',
};

function normalizeLegacyMarketProduct(raw: unknown): MarketProduct {
  const product = asRecord(raw);
  const actualPrice = toNumber(product.actualPrice);
  const discountPrice = toNumber(product.discountPrice);
  const marketPrice = toNumber(product.marketPrice);
  const totalPrice = toNumber(product.totalPrice);
  const name = toStringValue(product.name);
  const unitMap = parseUnitPriceMap(product.unit);
  const discountedUnitMap = parseUnitPriceMap(product.discountedUnit);
  const unitChoices = unitMap?.map(([unitName, price]) => {
    const discountedPrice = discountedUnitMap?.find(([key]) => key === unitName)?.[1];
    return {
      name: unitName,
      measure: getMeasureShortHand(unitName),
      priceNaira: price,
      discountedPriceNaira:
        discountedPrice && discountedPrice > 0 && discountedPrice !== price
          ? discountedPrice
          : undefined,
    };
  });
  const effectiveUnitPrices = unitChoices?.map(
    (choice) => choice.discountedPriceNaira ?? choice.priceNaira,
  );
  const effectivePrice =
    effectiveUnitPrices?.length
      ? Math.min(...effectiveUnitPrices)
      : [discountPrice, actualPrice, marketPrice, totalPrice].find((price) => price > 0) ?? 0;
  const compareAtNaira =
    unitChoices?.length
      ? Math.min(...unitChoices.map((choice) => choice.priceNaira))
      : actualPrice > 0 && actualPrice > effectivePrice
        ? actualPrice
        : undefined;
  const discountPct =
    compareAtNaira && compareAtNaira > effectivePrice
      ? Math.round(((compareAtNaira - effectivePrice) / compareAtNaira) * 100)
      : undefined;
  const rawUnit = toStringValue(product.unit);
  const unit =
    unitChoices?.[0]?.name ||
    (rawUnit && !isLikelyUnitPriceMap(rawUnit) ? rawUnit : '') ||
    toStringValue(product.purchaseUnit) ||
    toStringValue(product.newUnit) ||
    'Standard pack';
  const unitOptions = unitChoices?.map((choice) => choice.name) ?? [
    rawUnit && !isLikelyUnitPriceMap(rawUnit) ? rawUnit : '',
    toStringValue(product.newUnit),
    toStringValue(product.purchaseUnit),
  ].filter((value, index, items) => value && items.indexOf(value) === index);
  const categoryRaw = product.category;
  const categoryId = isRecord(categoryRaw)
    ? toStringValue(categoryRaw._id) || toStringValue(categoryRaw.id)
    : '';
  const categoryName = isRecord(categoryRaw)
    ? toStringValue(categoryRaw.name)
    : toStringValue(categoryRaw);
  const inStock = toOptionalBoolean(product.inStock) ?? true;
  const promotionRaw = asRecord(product.promotion);
  const promotionDiscountValue = toNumber(promotionRaw.discountValue);
  const promotion =
    promotionDiscountValue > 0
      ? {
          discountValue: promotionDiscountValue,
          isPercentageDiscounted: toBoolean(promotionRaw.isPercentageDiscounted),
        }
      : undefined;

  return {
    id: toStringValue(product._id) || toStringValue(product.id),
    name,
    description: toStringValue(product.description),
    imageUrl: firstImageUrl(product.images),
    longDescription: toStringValue(product.description) || undefined,
    brandLabel: toNullableString(product.brand) ?? undefined,
    priceNaira: effectivePrice,
    compareAtNaira,
    discountPct,
    promotion,
    unit,
    unitChoices: unitChoices?.length ? unitChoices : undefined,
    unitOptions: unitOptions.length > 1 ? unitOptions : undefined,
    inStock,
    stockNote:
      !inStock
        ? 'Out of stock'
        : toBoolean(product.isLowStock)
          ? 'Low stock'
          : 'Many in stock',
    unitPriceBadge: unit ? `${unit} = ₦${effectivePrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined,
    categoryId: categoryId || undefined,
    categoryName: categoryName || undefined,
  } as MarketProduct & { categoryId?: string; categoryName?: string };
}

function buildCategorySectionTitle(title: string) {
  return title;
}

function buildCategorySectionDescription(raw: unknown) {
  const desc = toStringValue(raw).trim();
  return desc || 'Browse available products in this category.';
}

function normalizeLegacyMarketCategory(raw: unknown): MarketCategory {
  const category = asRecord(raw);
  const title = toStringValue(category.name);
  const slug = toStringValue(category.slug) || toSlug(title);
  const products = asArray(category.products).map(normalizeLegacyMarketProduct);

  return {
    id: toStringValue(category._id) || slug,
    title,
    emoji: categoryEmojiMap[slug] ?? '🛒',
    imageUrl: firstImageUrl(category.image) || firstImageUrl(category.images),
    sectionTitle: buildCategorySectionTitle(title),
    sectionDescription: buildCategorySectionDescription(category.desc),
    merchantLabel: undefined,
    products: products.map((product) => ({
      ...product,
      categoryId: toStringValue(category._id) || slug,
      categoryName: title,
    })),
  };
}

export function normalizeLegacyMarketCategoriesResponse(payload: unknown): MarketCategoriesResponse {
  const root = asRecord(payload);
  return {
    status: true,
    message: toStringValue(root.message) || 'Categories retrieved successfully',
    data: asArray(root.data).map(normalizeLegacyMarketCategory),
  };
}

export function normalizeLegacyMarketCategoryResponse(payload: unknown): MarketCategoryResponse {
  const root = asRecord(payload);
  return {
    status: true,
    message: toStringValue(root.message) || 'Category retrieved successfully',
    data: normalizeLegacyMarketCategory(root.data),
  };
}

export function normalizeLegacyMarketProductResponse(payload: unknown): MarketProductResponse {
  const root = asRecord(payload);
  return {
    status: true,
    message: toStringValue(root.message) || 'Product retrieved successfully',
    data: normalizeLegacyMarketProduct(root.data),
  };
}

function normalizeLegacyMarketPromotion(raw: unknown): MarketPromotion {
  const promotion = asRecord(raw);
  const products = asArray(promotion.products).map(normalizeLegacyMarketProduct);

  return {
    id: toStringValue(promotion._id) || toStringValue(promotion.id),
    name: toStringValue(promotion.name),
    description: toStringValue(promotion.description),
    icon: toNullableString(promotion.icon) ?? undefined,
    isPercentageDiscounted: toBoolean(promotion.isPercentageDiscounted),
    discountValue: toNumber(promotion.discountValue),
    products,
  };
}

export function normalizeLegacyMarketPromotionsResponse(payload: unknown): MarketPromotionsResponse {
  const root = asRecord(payload);
  return {
    status: true,
    message: toStringValue(root.message) || 'Promotions retrieved successfully',
    data: asArray(root.data).map(normalizeLegacyMarketPromotion),
  };
}

export function normalizeLegacyMarketRecentOrdersResponse(payload: unknown): MarketRecentOrdersResponse {
  const root = asRecord(payload);
  return {
    status: true,
    message: toStringValue(root.message) || 'Recent order products retrieved successfully',
    data: asArray(root.data).map(normalizeLegacyMarketProduct),
  };
}

function isPopulatedLegacyProductRef(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (!toStringValue(value._id) && !toStringValue(value.id)) {
    return false;
  }

  return Boolean(toStringValue(value.name) || toStringValue(value.description));
}

/** Prefer live populated `product` over stale `cartProduct` snapshot (stock/pricing). */
function resolveCartLineProductRaw(item: Record<string, unknown>): unknown {
  const populated = item.product;
  const snapshot = item.cartProduct;

  if (isPopulatedLegacyProductRef(populated)) {
    return populated;
  }

  return snapshot ?? populated;
}

function normalizeLegacyCartItem(raw: unknown): MarketCartItem {
  const item = asRecord(raw);
  const productRaw = resolveCartLineProductRaw(item);
  const product = normalizeLegacyMarketProduct(productRaw);
  const productId = product.id || toStringValue(item.product);
  const unit = toStringValue(item.unit) || product.unit || 'Standard pack';
  const quantity = Math.max(0, toNumber(item.quantity));
  const lineTotal = toNumber(item.totalPrice) || getMarketUnitPrice(product, unit) * quantity;

  return {
    id: toStringValue(item._id) || toStringValue(item.id) || cartLineKey(productId, unit),
    productId,
    branchId: toStringValue(item.branch) || undefined,
    unit,
    quantity,
    product: product.id ? product : undefined,
    lineTotalNaira: lineTotal,
  };
}

export function normalizeLegacyCartResponse(payload: unknown): MarketCartResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const items = asArray(data.cartItems).map(normalizeLegacyCartItem);
  const totalPrice = toNumber(data.totalPrice) || items.reduce((sum, item) => sum + item.lineTotalNaira, 0);

  return {
    status: root.status === 'success' ? 'success' : true,
    message: toStringValue(root.message) || 'Cart retrieved successfully',
    data: {
      totalPrice,
      cartItems: items,
      count: toNumber(data.count) || items.length,
    },
  };
}

export function normalizeLegacyCartMutationResponse(
  payload: unknown,
  messageFallback: string,
): MarketCartMutationResponse {
  const root = asRecord(payload);
  const rawData = root.data;

  return {
    status: root.status === 'success' ? 'success' : true,
    message: toStringValue(root.message) || messageFallback,
    data: rawData ? normalizeLegacyCartItem(rawData) : null,
  };
}

function paginate<T>(items: T[], page = 1, limit = 10) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const start = (safePage - 1) * safeLimit;
  const data = items.slice(start, start + safeLimit);

  return {
    data,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
}

export function normalizeLegacyBranch(raw: unknown): BranchRecord {
  const branch = asRecord(raw);
  const employees = asArray(branch.employees);
  const createdAt = toStringValue(branch.createdAt);
  const updatedAt = toStringValue(branch.updatedAt) || createdAt;
  const isDeactivated = toBoolean(branch.isDeactivated);

  return {
    id: toStringValue(branch._id) || toStringValue(branch.id),
    businessId: toStringValue(branch.businessId),
    branchName: toStringValue(branch.branchName),
    branchCode: toStringValue(branch.branchCode),
    streetName: toStringValue(branch.streetName),
    lga: toStringValue(branch.lga),
    state: toStringValue(branch.state) || 'Lagos',
    isHeadquarter: toBoolean(branch.isHeadquarter),
    isDeactivated,
    activatedAt: isDeactivated ? null : createdAt || null,
    totalAmountProcured: toNumber(branch.totalAmountProcured),
    totalItemsPurchased: toNumber(branch.totalItemsPurchased),
    totalOrders: toNumber(branch.totalOrders),
    membersCount: employees.length,
    createdAt,
    updatedAt,
  };
}

export function normalizeLegacyBranchResponse(payload: unknown, messageFallback: string): BranchResponse {
  const root = asRecord(payload);
  return {
    status: true,
    message: toStringValue(root.message) || messageFallback,
    data: normalizeLegacyBranch(root.data),
  };
}

export function normalizeLegacyBranchDeleteResponse(payload: unknown, branchId: string): BranchDeleteResponse {
  const root = asRecord(payload);
  return {
    status: true,
    message: toStringValue(root.message) || 'Branch removed successfully',
    data: {
      id: branchId,
    },
  };
}

export function normalizeLegacyBranchListResponse(
  payload: unknown,
  page = 1,
  limit = 10,
  search?: string,
): BranchListResponse {
  const root = asRecord(payload);
  const branches = asArray(root.data).map(normalizeLegacyBranch);
  const query = search?.trim().toLowerCase();
  const filtered = query
    ? branches.filter((branch) =>
        [branch.branchName, branch.branchCode, branch.streetName, branch.lga]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    : branches;
  const paginated = paginate(filtered, page, limit);

  return {
    status: true,
    message: toStringValue(root.message) || 'Branches retrieved successfully',
    data: paginated.data,
    meta: paginated.meta,
  };
}

function resolveLegacyMemberBranch(raw: unknown) {
  const branch = asRecord(raw);
  const branchId = toStringValue(branch._id) || toStringValue(branch.id);
  const branchName = toNullableString(branch.branchName);

  return {
    branchId: branchId || null,
    branchName,
  };
}

function normalizeLegacyInviteMember(raw: unknown): BranchMemberRecord {
  const invite = asRecord(raw);
  const branch = resolveLegacyMemberBranch(invite.branchId);
  return {
    id: toStringValue(invite._id) || toStringValue(invite.invitationId),
    kind: 'invite',
    email: toStringValue(invite.email),
    firstName: null,
    lastName: null,
    position: 'Pending invite',
    role: normalizeEmployeeRole(invite.role),
    status: 'pending',
    createdAt: toStringValue(invite.createdAt),
    branchId: branch.branchId,
    branchName: branch.branchName,
  };
}

function normalizeLegacyEmployeeMember(raw: unknown): BranchMemberRecord {
  const employee = asRecord(raw);
  const branch = resolveLegacyMemberBranch(employee.branchId);
  return {
    id: toStringValue(employee._id) || toStringValue(employee.id),
    kind: 'member',
    email: toStringValue(employee.email),
    firstName: toNullableString(employee.firstName),
    lastName: toNullableString(employee.lastName),
    position: toStringValue(employee.position),
    role: normalizeEmployeeRole(employee.role),
    status: toBoolean(employee.isDeactivated) ? 'inactive' : 'active',
    createdAt: toStringValue(employee.createdAt),
    branchId: branch.branchId,
    branchName: branch.branchName,
  };
}

export function normalizeLegacyBranchMembersResponse(
  employeesPayload: unknown,
  invitesPayload: unknown,
  page = 1,
  limit = 10,
  search?: string,
): BranchMembersResponse {
  const employees = asArray(asRecord(employeesPayload).data).map(normalizeLegacyEmployeeMember);
  const invites = asArray(asRecord(invitesPayload).data).map(normalizeLegacyInviteMember);
  const all = [...employees, ...invites].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const query = search?.trim().toLowerCase();
  const filtered = query
    ? all.filter((member) =>
        [
          member.email,
          member.firstName ?? '',
          member.lastName ?? '',
          member.position,
          member.role,
          member.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    : all;
  const paginated = paginate(filtered, page, limit);

  return {
    message: 'Members retrieved successfully',
    data: paginated.data,
    meta: paginated.meta,
  };
}

function normalizeLegacyEmployeeDetail(raw: unknown): EmployeeMemberDetail {
  const employee = asRecord(raw);
  const branch = asRecord(employee.branchId);
  return {
    id: toStringValue(employee._id) || toStringValue(employee.id),
    businessId: toStringValue(employee.businessId),
    branchId: toStringValue(branch._id) || toStringValue(employee.branchId),
    email: toStringValue(employee.email),
    role: normalizeEmployeeRole(employee.role),
    position: toStringValue(employee.position),
    firstName: toStringValue(employee.firstName),
    lastName: toStringValue(employee.lastName),
    phoneNumber: toStringValue(employee.phoneNumber),
    status: toBoolean(employee.isDeactivated) ? 'inactive' : 'active',
    verifiedAt: toBoolean(employee.verified) ? toNullableString(employee.updatedAt) : null,
    createdAt: toStringValue(employee.createdAt),
    updatedAt: toStringValue(employee.updatedAt),
  };
}

export function normalizeLegacyEmployeeResponse(payload: unknown, messageFallback: string): EmployeeMemberResponse {
  const root = asRecord(payload);
  return {
    message: toStringValue(root.message) || messageFallback,
    data: normalizeLegacyEmployeeDetail(root.data),
  };
}

export function normalizeLegacyEmployeeDeleteResponse(payload: unknown, employeeId: string): EmployeeDeleteResponse {
  const root = asRecord(payload);
  return {
    message: toStringValue(root.message) || 'Employee deleted successfully',
    data: {
      id: employeeId,
    },
  };
}

export function normalizeLegacyCancelInviteResponse(
  payload: unknown,
  invitationId: string,
): CancelEmployeeInviteResponse {
  const root = asRecord(payload);
  return {
    message: toStringValue(root.message) || 'Invitation cancelled successfully',
    data: {
      invitationId,
    },
  };
}

export function normalizeLegacyInviteResponse(payload: unknown, messageFallback: string): EmployeeInviteResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  return {
    message: toStringValue(root.message) || messageFallback,
    data: {
      invitationId: toStringValue(data.invitationId) || toStringValue(data._id),
      email: toStringValue(data.email),
      role: normalizeEmployeeRole(data.role),
      branchId: toStringValue(data.branchId),
      activationUrl: toStringValue(data.activationUrl),
    },
  };
}

export function normalizeLegacyInvitationDetails(payload: unknown): EmployeeInvitationResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  return {
    message: toStringValue(root.message) || 'Invitation fetched successfully',
    data: {
      invitationId: toStringValue(data.invitationId) || toStringValue(data._id),
      email: toStringValue(data.email),
      role: normalizeEmployeeRole(data.role),
      branchId: toStringValue(data.branchId),
      branchName: toNullableString(data.branchName),
      businessName: toNullableString(data.businessName),
    },
  };
}

export function toLegacyRequestListQuery(query: Record<string, unknown>): Record<string, unknown> {
  const next = { ...query };
  const status = typeof next.status === 'string' ? next.status.trim() : '';

  // Legacy list uses filterBy/filterValue; comma-separated status is OR ($in) in request.service.
  if (status) {
    next.filterBy = 'status';
    next.filterValue = status;
    delete next.status;
  }

  return next;
}

export function toLegacyOrderListQuery(query: Record<string, unknown>): Record<string, unknown> {
  return { ...query };
}

export function toLegacyRejectRequestBody(body: Record<string, unknown>): Record<string, unknown> {
  if (typeof body.rejectionReasons === 'string') {
    return body;
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason) {
    return body;
  }

  const { reason: _removed, ...rest } = body;
  return { ...rest, rejectionReasons: reason };
}

export function toLegacyCreateRequestBody(body: Record<string, unknown>): Record<string, unknown> {
  const address = asRecord(body.address);
  const branch = toStringValue(body.branchId ?? body.branch);

  return {
    branch,
    phoneNumber: body.phoneNumber,
    address: {
      streetAddress: address.streetAddress,
      lga: address.lga,
      state: address.state ?? 'Lagos',
      direction: address.directions ?? address.direction ?? '',
    },
    ...(body.paymentMethod ? { paymentMethod: body.paymentMethod } : {}),
    ...(body.deliveryFee !== undefined ? { deliveryFee: body.deliveryFee } : {}),
    ...(body.serviceCharge !== undefined ? { serviceCharge: body.serviceCharge } : {}),
  };
}

function mapLegacyRequestActor(raw: unknown): RequestActorRecord | null {
  if (!raw) {
    return null;
  }

  if (typeof raw === 'string') {
    const accountId = raw.trim();
    if (!accountId) {
      return null;
    }

    return {
      accountId,
      user_type: 'employee',
      email: '',
      firstName: null,
      lastName: null,
      phoneNumber: null,
      role: 'employee',
    };
  }

  const actor = asRecord(raw);
  if (!toStringValue(actor._id ?? actor.id) && !toStringValue(actor.email)) {
    return null;
  }

  const isBusinessOwner =
    Boolean(actor.businessName) && !actor.branchId && !actor.position;

  return {
    accountId: toStringValue(actor._id ?? actor.id),
    user_type: isBusinessOwner ? 'customer' : 'employee',
    email: toStringValue(actor.email),
    firstName: toNullableString(actor.firstName),
    lastName: toNullableString(actor.lastName),
    phoneNumber: toNullableString(actor.phoneNumber),
    role: toStringValue(actor.role) || (isBusinessOwner ? 'super_admin' : 'employee'),
    branchId: toNullableString(actor.branchId),
  };
}

function resolveLegacyRequestLineProduct(item: Record<string, unknown>) {
  const cartProduct = isRecord(item.cartProduct) ? item.cartProduct : null;
  const populatedProduct = isRecord(item.product) ? item.product : null;
  const candidates = [populatedProduct, cartProduct].filter(
    (candidate): candidate is Record<string, unknown> => Boolean(candidate),
  );

  return candidates.find(hasLegacyProductPricing) ?? cartProduct ?? populatedProduct;
}

function applySubtotalFallbackToRequestProducts(
  lines: RequestProductRecord[],
  subtotal: number,
) {
  if (subtotal <= 0 || lines.length === 0) {
    return lines;
  }

  const pricedTotal = lines.reduce((sum, line) => sum + line.totalPrice, 0);
  if (pricedTotal > 0) {
    return lines;
  }

  const weightTotal =
    lines.reduce((sum, line) => sum + (line.quantity > 0 ? line.quantity : 1), 0) || lines.length;

  return lines.map((line) => {
    const weight = line.quantity > 0 ? line.quantity : 1;
    const totalPrice = Math.round((subtotal * weight) / weightTotal);
    const unitPrice = line.quantity > 0 ? totalPrice / line.quantity : totalPrice;

    return {
      ...line,
      unitPrice,
      totalPrice,
    };
  });
}

function mapLegacyRequestProducts(
  products: unknown,
  context?: { businessId?: string; subtotal?: number },
): RequestProductRecord[] {
  const businessId = context?.businessId;
  const lines = asArray(products).map((raw) => {
    const item = asRecord(raw);
    const productRaw = resolveLegacyRequestLineProduct(item);
    const product = asRecord(productRaw);
    const quantity = Math.max(0, toNumber(item.quantity));
    const unit = productRaw ? resolveRequestLineUnit(item, product) : 'Standard pack';
    const storedLineTotal = toNumber(item.totalPrice);
    const lineTotal =
      storedLineTotal > 0
        ? storedLineTotal
        : productRaw
          ? calculateLegacyRequestLineTotal(item, product, businessId)
          : 0;
    const unitPrice = quantity > 0 ? lineTotal / quantity : lineTotal;

    const inStock = toOptionalBoolean(product.inStock);

    return {
      cartLineId: toNullableString(
        item._id ?? item.id ?? item.cartId,
      ),
      productId: toNullableString(product._id ?? product.id ?? item.product),
      productName: toStringValue(product.productName ?? product.name) || 'Product',
      quantity,
      unitPrice,
      totalPrice: lineTotal,
      unit: toNullableString(unit),
      imageUrl:
        firstImageUrl(product.images) ??
        coerceImageUrlCandidate(product.image) ??
        coerceImageUrlCandidate(product.imageUrl) ??
        null,
      inStock: inStock ?? true,
    };
  });

  return applySubtotalFallbackToRequestProducts(lines, context?.subtotal ?? 0);
}

function normalizeLegacyCouponCode(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || ['false', 'true', 'null', 'undefined'].includes(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed;
}

function mapLegacyCouponDetails(data: unknown): RequestRecord['couponDetails'] {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const record = data as Record<string, unknown>;
  const code = normalizeLegacyCouponCode(record.code) ?? normalizeLegacyCouponCode(toStringValue(record.code));
  if (!code) {
    return null;
  }

  const type = toStringValue(record.type);
  return {
    code,
    type: (type || 'FIXED_AMOUNT') as NonNullable<RequestRecord['couponDetails']>['type'],
    discount: Number(record.discount ?? 0),
  };
}

function isFreeDeliveryCouponDetails(
  couponDetails: RequestRecord['couponDetails'],
): boolean {
  return couponDetails?.type === 'FREE_DELIVERY';
}

function resolveLegacyBillableDiscount(input: {
  discount: number;
  couponDetails: RequestRecord['couponDetails'];
}): number {
  if (isFreeDeliveryCouponDetails(input.couponDetails)) {
    return 0;
  }

  return input.discount;
}

/** Matches legacy-api default delivery tiers when fee was zeroed by coupon remove. */
function estimateLegacyDeliveryFee(subtotal: number): number {
  const tier1Base = 18000;
  const tier1Threshold = 1_000_000;
  if (subtotal < tier1Threshold) {
    return tier1Base + subtotal * 0.02;
  }
  return 33000 + subtotal * 0.01;
}

function resolveLegacyRequestDeliveryFee(input: {
  deliveryFee: number;
  subtotal: number;
  status: string;
  coupon: boolean;
}): number {
  if (
    !input.coupon &&
    input.deliveryFee === 0 &&
    input.status === 'pending' &&
    input.subtotal >= 25000
  ) {
    return estimateLegacyDeliveryFee(input.subtotal);
  }

  return input.deliveryFee;
}

function mapLegacyRequestRecord(data: Record<string, unknown>): RequestRecord {
  const branch =
    typeof data.branch === 'string'
      ? { _id: data.branch, id: data.branch }
      : asRecord(data.branch);
  const address = asRecord(data.address);
  const directions = toNullableString(address.directions ?? address.direction);
  const initiator = mapLegacyRequestActor(data.initiator);
  const storedSubtotal = Number(data.subtotal ?? 0);
  const storedDeliveryFee = Number(data.deliveryFee ?? 0);
  const serviceCharge = Number(data.serviceCharge ?? 0);
  const requestStatus = toStringValue(data.status) || 'pending';
  const couponApplied = data.coupon === true;
  const couponDetails = mapLegacyCouponDetails(data.couponDetails);
  const discount = resolveLegacyBillableDiscount({
    discount: Number(data.discount ?? 0),
    couponDetails,
  });
  const businessId = toStringValue(branch.businessId ?? data.businessId);
  const products = mapLegacyRequestProducts(data.products, {
    businessId,
    subtotal: storedSubtotal,
  });
  const productsSubtotal = products.reduce((sum, line) => sum + line.totalPrice, 0);
  // Legacy API sometimes stored delivery/service inside `subtotal`; prefer line sum when available.
  const subtotal = productsSubtotal > 0 ? productsSubtotal : storedSubtotal;
  const deliveryFee = resolveLegacyRequestDeliveryFee({
    deliveryFee: storedDeliveryFee,
    subtotal,
    status: requestStatus,
    coupon: couponApplied,
  });
  const computedTotal = subtotal + deliveryFee + serviceCharge - discount;
  const storedTotal = Number(data.totalPrice ?? 0);
  const totalPrice =
    productsSubtotal > 0 ? computedTotal : storedTotal > 0 ? storedTotal : computedTotal;

  return {
    id: toStringValue(data._id ?? data.id),
    businessId: toStringValue(data.business ?? data.businessId ?? branch.businessId),
    branchId: toStringValue(branch._id ?? branch.id ?? data.branchId),
    branchName: toStringValue(branch.branchName),
    branchCode: toNullableString(branch.branchCode),
    reference: toStringValue(data.reference),
    status: requestStatus as RequestRecord['status'],
    paymentStatus: (toStringValue(data.paymentStatus) || 'pending') as RequestRecord['paymentStatus'],
    paymentMethod: toNullableString(data.paymentMethod),
    initiator: initiator ?? {
      accountId: '',
      user_type: 'employee',
      email: '',
      firstName: null,
      lastName: null,
      phoneNumber: null,
      role: 'employee',
    },
    approver: mapLegacyRequestActor(data.approver),
    rejectedBy: mapLegacyRequestActor(data.rejectedBy),
    rejectedReasons: toNullableString(data.rejectedReasons ?? data.rejectionReason),
    address: {
      streetAddress: toStringValue(address.streetAddress),
      ...(directions ? { directions } : {}),
      state: toStringValue(address.state) || 'Lagos',
      lga: toStringValue(address.lga),
    },
    phoneNumber: toStringValue(data.phoneNumber),
    products,
    subtotal,
    deliveryFee,
    serviceCharge,
    discount,
    totalPrice,
    coupon: couponApplied,
    couponCode: normalizeLegacyCouponCode(data.couponCode) ?? normalizeLegacyCouponCode(toNullableString(data.couponCode)),
    couponDetails,
    approvedAt: toNullableString(data.approvedAt),
    rejectedAt: toNullableString(data.rejectedAt),
    cancelledAt: toNullableString(data.cancelledAt),
    createdAt: toStringValue(data.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(data.updatedAt) || new Date().toISOString(),
  };
}

export function normalizeLegacyRequestResponse(
  payload: unknown,
  messageFallback = 'Request retrieved successfully',
): RequestResponse {
  const root = asRecord(payload);

  return {
    message: toStringValue(root.message) || messageFallback,
    status: root.status === true || root.status === 'success',
    data: mapLegacyRequestRecord(asRecord(root.data)),
  };
}

export type ApproveRequestResponse = RequestResponse & {
  orderId: string | null;
};

export function normalizeLegacyApproveRequestResponse(
  payload: unknown,
  messageFallback = 'Request approved successfully',
): ApproveRequestResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const orderRaw = data.order;
  const orderRecord = orderRaw ? asRecord(orderRaw) : null;
  const orderId = orderRecord
    ? toStringValue(orderRecord._id ?? orderRecord.id)
    : null;

  return {
    message: toStringValue(root.message) || messageFallback,
    status: root.status === true || root.status === 'success',
    data: mapLegacyRequestRecord(data),
    orderId: orderId || null,
  };
}

export type LegacyRequestListFilterOptions = {
  search?: string;
  branchId?: string;
  status?: string;
  amountFrom?: number;
  amountTo?: number;
};

const REQUEST_STATUS_FILTER_SET = new Set(['pending', 'approved', 'rejected', 'cancelled']);

function readLegacyRequestListMeta(
  root: Record<string, unknown>,
  page: number,
  limit: number,
): RequestListResponse['meta'] | null {
  const meta = asRecord(root.meta);
  const total = Number(meta.total);

  if (!Number.isFinite(total) || total < 0) {
    return null;
  }

  const safePage = Number.isFinite(Number(meta.page)) && Number(meta.page) > 0 ? Number(meta.page) : page;
  const safeLimit =
    Number.isFinite(Number(meta.limit)) && Number(meta.limit) > 0 ? Number(meta.limit) : limit;
  const totalPages =
    Number.isFinite(Number(meta.totalPages)) && Number(meta.totalPages) > 0
      ? Number(meta.totalPages)
      : Math.max(1, Math.ceil(total / safeLimit));

  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    hasNextPage:
      typeof meta.hasNextPage === 'boolean' ? meta.hasNextPage : safePage < totalPages,
    hasPrevPage: typeof meta.hasPrevPage === 'boolean' ? meta.hasPrevPage : safePage > 1,
  };
}

export function normalizeLegacyRequestListResponse(
  payload: unknown,
  page = 1,
  limit = 10,
  filters: LegacyRequestListFilterOptions = {},
): RequestListResponse {
  const root = asRecord(payload);
  let items = asArray(root.data).map((item) => mapLegacyRequestRecord(asRecord(item)));
  const query = filters.search?.trim().toLowerCase();

  if (query) {
    items = items.filter((request) =>
      [
        request.reference,
        request.branchName,
        request.initiator.email,
        request.initiator.firstName ?? '',
        request.initiator.lastName ?? '',
        ...request.products.map((product) => product.productName),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }

  const branchId = filters.branchId?.trim();
  if (branchId) {
    items = items.filter((request) => request.branchId === branchId);
  }

  const statusRaw = filters.status?.trim();
  if (statusRaw) {
    const statuses = statusRaw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => REQUEST_STATUS_FILTER_SET.has(entry));

    if (statuses.length > 0) {
      items = items.filter((request) =>
        statuses.includes(String(request.status).toLowerCase()),
      );
    }
  }

  if (filters.amountFrom != null && !Number.isNaN(filters.amountFrom)) {
    items = items.filter((request) => request.totalPrice >= filters.amountFrom!);
  }

  if (filters.amountTo != null && !Number.isNaN(filters.amountTo)) {
    items = items.filter((request) => request.totalPrice <= filters.amountTo!);
  }

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const legacyMeta = readLegacyRequestListMeta(root, safePage, safeLimit);

  if (legacyMeta) {
    return {
      status: true,
      message: toStringValue(root.message) || 'Requests fetched successfully',
      data: items,
      meta: legacyMeta,
    };
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const normalizedPage = Math.min(safePage, totalPages);
  const offset = (normalizedPage - 1) * safeLimit;
  const pageItems = items.slice(offset, offset + safeLimit);

  return {
    status: true,
    message: toStringValue(root.message) || 'Requests fetched successfully',
    data: pageItems,
    meta: {
      page: normalizedPage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: normalizedPage < totalPages,
      hasPrevPage: normalizedPage > 1,
    },
  };
}

export function normalizeLegacyCreateRequestResponse(payload: unknown): RequestResponse {
  return normalizeLegacyRequestResponse(payload, 'Request created successfully');
}

function normalizeWalletTransactionType(value: unknown): WalletTransactionRecord['type'] {
  const raw = toStringValue(value).toLowerCase();
  return raw === 'debit' ? 'debit' : 'credit';
}

function normalizeWalletTransactionStatus(value: unknown): WalletTransactionRecord['status'] {
  const raw = toStringValue(value).toLowerCase();
  if (raw === 'pending') {
    return 'pending';
  }
  if (raw === 'cancelled' || raw === 'canceled') {
    return 'cancelled';
  }
  return 'successful';
}

function normalizeLegacyWalletTransaction(raw: unknown): WalletTransactionRecord {
  const row = asRecord(raw);
  return {
    id: toStringValue(row._id ?? row.id),
    reference: toStringValue(row.reference),
    amount: toNumber(row.amount),
    type: normalizeWalletTransactionType(row.type),
    status: normalizeWalletTransactionStatus(row.status),
    description: toStringValue(row.description),
    paymentReference: toStringValue(row.paymentReference),
    createdAt: toStringValue(row.createdAt),
  };
}

function formatLegacyWalletAccountValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return toStringValue(value);
}

export function normalizeLegacyWallet(raw: unknown): WalletRecord {
  const row = asRecord(raw);
  return {
    id: toStringValue(row._id ?? row.id),
    reference: toStringValue(row.reference),
    balance: toNumber(row.balance),
    accountName: formatLegacyWalletAccountValue(row.accountName),
    accountNumber: formatLegacyWalletAccountValue(row.accountNumber),
    bankName: formatLegacyWalletAccountValue(row.bankName),
    bankCode: formatLegacyWalletAccountValue(row.bankCode),
    active: row.active !== false,
    createdAt: toStringValue(row.createdAt),
  };
}

export function normalizeLegacyVerifyBvnResponse(payload: unknown): VerifyBvnResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const phoneNumber = toStringValue(data.phoneNumber);

  return {
    status: root.status === true || root.status === undefined,
    message: toStringValue(root.message) || 'BVN verified successfully',
    data: phoneNumber ? { phoneNumber } : {},
  };
}

export function normalizeLegacyWalletResponse(
  payload: unknown,
  messageFallback = 'Wallet fetched successfully',
): WalletResponse {
  const root = asRecord(payload);
  return {
    status: root.status === true || root.status === undefined,
    message: toStringValue(root.message) || messageFallback,
    data: normalizeLegacyWallet(root.data),
  };
}

export function normalizeLegacyWalletActionResponse(payload: unknown, messageFallback: string) {
  const root = asRecord(payload);
  return {
    status: root.status !== false,
    message: toStringValue(root.message) || messageFallback,
  };
}

export function normalizeLegacyWalletTransactionsResponse(payload: unknown): WalletTransactionsResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const transactions = asArray(data.transactions).map(normalizeLegacyWalletTransaction);
  const page = toNumber(data.meta && isRecord(data.meta) ? data.meta.page : 1) || 1;
  const limit = toNumber(data.meta && isRecord(data.meta) ? data.meta.limit : 10) || 10;

  return {
    status: root.status === true || root.status === undefined,
    message: toStringValue(root.message) || 'Transactions fetched successfully',
    data: {
      transactions,
      totalTransactions: toNumber(data.totalTransactions) || transactions.length,
      meta: { page, limit },
    },
  };
}

function normalizeLegacyOrderStatus(value: unknown): OrderStatus {
  const status = toStringValue(value).toLowerCase();
  const allowed: OrderStatus[] = [
    'pending',
    'processing',
    'confirmed',
    'shipped',
    'delivered',
    'partially_delivered',
    'cancelled',
    'returned',
    'refunded',
    'completed',
    'accepted',
    'ready',
  ];

  return (allowed.includes(status as OrderStatus) ? status : 'pending') as OrderStatus;
}

function normalizeLegacyOrderPaymentStatus(value: unknown): OrderPaymentStatus {
  const status = toStringValue(value).toLowerCase();
  if (status === 'paid' || status === 'cancelled' || status === 'partial') {
    return status;
  }

  return 'pending';
}

function mapLegacyTimelineRecord(item: Record<string, unknown>): OrderTimelineRecord {
  return {
    id: toStringValue(item._id ?? item.id),
    title: toStringValue(item.title) || 'Update',
    description: toNullableString(item.description),
    createdAt: toStringValue(item.createdAt) || new Date().toISOString(),
  };
}

function resolveLegacyOrderDiscount(
  data: Record<string, unknown>,
  request: Record<string, unknown>,
): number {
  const couponDetails = mapLegacyCouponDetails(request.couponDetails);
  if (isFreeDeliveryCouponDetails(couponDetails)) {
    return 0;
  }

  const orderDiscount = toNumber(data.discount);
  const couponApplied =
    data.coupon === true || data.coupon === 1 || data.coupon === 'true';
  const requestDiscount = resolveLegacyBillableDiscount({
    discount: toNumber(request.discount),
    couponDetails,
  });

  // Older orders stored the coupon flag (true) in discount; Mongoose coerced it to 1.
  if (couponApplied && orderDiscount <= 1 && requestDiscount > orderDiscount) {
    return requestDiscount;
  }

  return orderDiscount;
}

function mapLegacyOrderRecord(data: Record<string, unknown>): OrderRecord {
  const branch =
    typeof data.branch === 'string'
      ? { _id: data.branch, id: data.branch }
      : asRecord(data.branch);
  const request = asRecord(data.request);
  const address = asRecord(data.address);
  const directions = toNullableString(address.directions ?? address.direction);
  const initiator = mapLegacyRequestActor(request.initiator);
  const businessId = toStringValue(
    data.business ?? data.businessId ?? data.customerId ?? branch.businessId,
  );
  const storedTotal = toNumber(data.totalPrice);
  const products = mapLegacyRequestProducts(data.products, {
    businessId,
    subtotal: storedTotal,
  });
  const productsSubtotal = products.reduce((sum, line) => sum + line.totalPrice, 0);
  const deliveryFee = toNumber(data.deliveryFee);
  const serviceCharge = toNumber(data.serviceCharge);
  const discount = resolveLegacyOrderDiscount(data, request);
  const subtotal =
    productsSubtotal > 0
      ? productsSubtotal
      : Math.max(0, storedTotal - deliveryFee - serviceCharge + discount);
  const computedTotal = subtotal + deliveryFee + serviceCharge - discount;
  // Prefer recomputed totals when line items are available — legacy orders may
  // store totalPrice with delivery counted twice after coupon checkout.
  const totalPrice = productsSubtotal > 0 ? computedTotal : storedTotal > 0 ? storedTotal : computedTotal;

  return {
    id: toStringValue(data._id ?? data.id),
    reference: toStringValue(data.reference),
    status: normalizeLegacyOrderStatus(data.status),
    paymentStatus: normalizeLegacyOrderPaymentStatus(data.paymentStatus),
    paymentMethod: toNullableString(data.paymentMethod),
    businessId,
    branchId: toStringValue(branch._id ?? branch.id ?? data.branchId),
    branchName: toStringValue(branch.branchName),
    requestId: toNullableString(request._id ?? request.id ?? data.request),
    initiator,
    phoneNumber: toStringValue(data.phoneNumber),
    address: {
      streetAddress: toStringValue(address.streetAddress),
      ...(directions ? { directions } : {}),
      state: toStringValue(address.state) || 'Lagos',
      lga: toStringValue(address.lga),
    },
    products,
    subtotal,
    deliveryFee,
    serviceCharge,
    discount,
    totalPrice,
    createdAt: toStringValue(data.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(data.updatedAt) || new Date().toISOString(),
    shippedAt: toNullableString(data.shippedAt),
    deliveredAt: toNullableString(data.deliveredAt),
    cancelledAt: toNullableString(data.cancelledAt),
  };
}

export function normalizeLegacyOrderResponse(
  payload: unknown,
  messageFallback = 'Order retrieved successfully',
): OrderResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const timeline = asArray(data.timeline).map((item) => mapLegacyTimelineRecord(asRecord(item)));
  const order = mapLegacyOrderRecord(data);

  const detail: OrderDetailRecord = {
    ...order,
    ...(timeline.length > 0 ? { timeline } : {}),
  };

  return {
    message: toStringValue(root.message) || messageFallback,
    status: root.status === true || root.status === 'success',
    data: detail,
  };
}

export function normalizeLegacyOrderListResponse(
  payload: unknown,
  page = 1,
  limit = 10,
  search?: string,
): OrderListResponse {
  const root = asRecord(payload);
  let items = asArray(root.data).map((item) => mapLegacyOrderRecord(asRecord(item)));
  const query = search?.trim().toLowerCase();

  if (query) {
    items = items.filter((order) =>
      [
        order.reference,
        order.branchName,
        order.initiator?.email ?? '',
        order.initiator?.firstName ?? '',
        order.initiator?.lastName ?? '',
        ...order.products.map((product) => product.productName),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const rootMeta = asRecord(root.meta);
  const legacyTotal = Number(rootMeta.total);

  let pageItems = items;
  if (items.length > safeLimit) {
    const offset = (safePage - 1) * safeLimit;
    pageItems = items.slice(offset, offset + safeLimit);
  }

  const observedMinimum = (safePage - 1) * safeLimit + pageItems.length;
  const total =
    query && items.length > safeLimit
      ? items.length
      : Number.isFinite(legacyTotal) && legacyTotal >= 0
        ? Math.max(legacyTotal, observedMinimum)
        : pageItems.length >= safeLimit
          ? safePage * safeLimit + 1
          : observedMinimum;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const normalizedPage = Math.min(safePage, totalPages);
  const hasNextPage = normalizedPage < totalPages;
  const hasPrevPage = normalizedPage > 1;

  return {
    status: true,
    message: toStringValue(root.message) || 'Orders fetched successfully',
    data: pageItems,
    meta: {
      page: normalizedPage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
}

export function normalizeLegacyOrderTimelineResponse(
  payload: unknown,
  messageFallback = 'Timeline fetched successfully',
): OrderTimelineResponse {
  const root = asRecord(payload);
  const timeline = asArray(root.data).map((item) => mapLegacyTimelineRecord(asRecord(item)));

  return {
    message: toStringValue(root.message) || messageFallback,
    status: root.status === true || root.status === 'success',
    data: timeline,
  };
}

function mapLegacyShoppingListItems(
  items: unknown,
  businessId?: string,
): ShoppingListItemRecord[] {
  return mapLegacyRequestProducts(items, { businessId }).map((line, index) => {
    const raw = asRecord(asArray(items)[index]);
    return {
      id: toStringValue(raw._id ?? raw.id) || `${line.productId}-${index}`,
      productId: line.productId ?? '',
      productName: line.productName,
      quantity: line.quantity,
      unit: line.unit ?? 'Standard pack',
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice,
      imageUrl: line.imageUrl ?? null,
      inStock: line.inStock ?? true,
    };
  });
}

export function mapLegacyShoppingListRecord(data: Record<string, unknown>): ShoppingListRecord {
  const businessId = toStringValue(data.businessId);
  const items = mapLegacyShoppingListItems(data.items, businessId);

  return {
    id: toStringValue(data._id ?? data.id),
    businessId,
    branchId: toStringValue(data.branchId),
    name: toStringValue(data.name),
    description: toNullableString(data.description),
    items,
    itemCount: items.length,
    createdAt: toStringValue(data.createdAt) || new Date().toISOString(),
    updatedAt: toStringValue(data.updatedAt) || new Date().toISOString(),
  };
}

export function normalizeLegacyShoppingListResponse(
  payload: unknown,
  messageFallback = 'Shopping list retrieved successfully',
): ShoppingListResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);

  return {
    message: toStringValue(root.message) || messageFallback,
    status: root.status === true || root.status === 'success',
    data: mapLegacyShoppingListRecord(data),
  };
}

export function normalizeLegacyShoppingListListResponse(
  payload: unknown,
  messageFallback = 'Shopping lists fetched successfully',
): ShoppingListListResponse {
  const root = asRecord(payload);

  return {
    message: toStringValue(root.message) || messageFallback,
    status: root.status === true || root.status === 'success',
    data: asArray(root.data).map((item) => mapLegacyShoppingListRecord(asRecord(item))),
  };
}

export function normalizeLegacyShoppingListMoveResponse(
  payload: unknown,
  messageFallback = 'Items moved successfully',
): ShoppingListMoveResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);

  return {
    message: toStringValue(root.message) || messageFallback,
    status: root.status === true || root.status === 'success',
    data: {
      movedItems: Number(data.movedItems ?? 0),
    },
  };
}

export function normalizeLegacyShoppingListActionResponse(
  payload: unknown,
  messageFallback: string,
) {
  const root = asRecord(payload);

  return {
    message: toStringValue(root.message) || messageFallback,
    status: root.status === true || root.status === 'success',
  };
}
