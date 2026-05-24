import * as path from 'path';
import * as fs from 'fs';
import { ProductDocument } from '../product/entities/product.entity';
import * as crypto from 'crypto';
import { DateFilterType } from '../admin/product/enum/product.enum';
import { DateRange } from '../admin/product/interface/product.interface';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { BadRequestException } from '@nestjs/common';
import {
  getDashboardTimezone,
  zonedEndOfDay,
  zonedEndOfMonth,
  zonedEndOfWeek,
  zonedEndOfYear,
  zonedStartOfDay,
  zonedStartOfMonth,
  zonedStartOfWeek,
  zonedStartOfYear,
  zonedSubDays,
  zonedSubMonths,
  zonedSubWeeks,
  zonedSubYears,
} from './dashboard-timezone';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DatauriParser = require('datauri/parser');
const parser = new DatauriParser();

export const formatValidationError = (allErrors): string[] => {
  const errors: string[] = [];
  allErrors.details.forEach((error) =>
    errors.push(error.message.replace(/['"]+/g, '')),
  );
  return errors;
};

export const generateOtp = () => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString();
};

export const readTemplate = (fileName: string, variables: any) => {
  const rootDir = process.cwd();
  // Build the path to the HTML template
  const filePath = path.join(rootDir, 'src', 'templates', `${fileName}.html`);
  let temp = fs.readFileSync(filePath, 'utf8');

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\[${key}\\]`, 'g');
    temp = temp.replace(placeholder, value as string);
  }

  return temp;
};

export const generateRandomCode = () => {
  const timestamp = new Date().getTime().toString(16);
  const characters = '0123456789ABCDEF';
  const randomChars = [];

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomChars.push(characters.charAt(randomIndex));
  }

  const code = timestamp + randomChars.join('');

  return code.toUpperCase();
};

export const formatBufferToBase64 = async (file: any) => {
  const image = parser.format(
    path.extname(file.originalname).toString(),
    file.buffer,
  );
  return image;
};

export const escapeRegex = (text: string) => {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function parseUnitPriceMap(raw: unknown): Record<string, number> | null {
  if (typeof raw !== 'string' || !raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const unitMap: Record<string, number> = {};
    for (const [unit, price] of Object.entries(parsed)) {
      const numericPrice = Number(price);
      if (!Number.isNaN(numericPrice)) {
        unitMap[unit] = numericPrice;
      }
    }

    return unitMap;
  } catch {
    return null;
  }
}

function resolvePricingProduct(item: any, useLivePrice: boolean): ProductDocument | null {
  if (useLivePrice && item?.product && typeof item.product === 'object') {
    return item.product;
  }

  if (item?.cartProduct && typeof item.cartProduct === 'object') {
    return item.cartProduct;
  }

  if (item?.product && typeof item.product === 'object') {
    return item.product;
  }

  return null;
}

export const calculateTotalPrice = (
  cartItems: any,
  businessId: any,
  useLivePrice: boolean = false,
) => {
  let total: number = 0;
  const pricingBusinessId =
    typeof businessId === 'object' && businessId !== null
      ? businessId._id?.toString?.() ?? businessId.id?.toString?.() ?? String(businessId)
      : String(businessId);

  cartItems.forEach((item: any) => {
    const product = resolvePricingProduct(item, useLivePrice);
    if (!product) {
      return;
    }

    const quantity = Number(item?.quantity ?? 0);
    if (!quantity) {
      return;
    }

    if (product.version === 'v2') {
      const unitData =
        parseUnitPriceMap(product.discountedUnit) ?? parseUnitPriceMap(product.unit);
      const unitPrice = unitData?.[item.unit];
      if (typeof unitPrice === 'number' && !Number.isNaN(unitPrice)) {
        total += unitPrice * quantity;
        return;
      }

      total += Number(product.discountPrice ?? 0) * quantity;
      return;
    }

    const specialPrice = (product?.specialPrices || []).find((entry: any) => {
      const customerId = entry?.customerId?.toString?.() ?? entry?.customerId;
      return customerId === pricingBusinessId;
    });
    const price = specialPrice ? specialPrice.price : product.discountPrice;
    total += Number(price ?? 0) * quantity;
  });
  return total;
};

// const BASE_FEE = 2500;

// export const calculateDeliveryFee = (total: number) => {
//   let deliveryFee: number;

//   if (total <= 50000) {
//     deliveryFee = 4500;
//   } else if (total <= 100000) {
//     deliveryFee = 7000;
//   } else if (total <= 150000) {
//     deliveryFee = 9000;
//   } else if (total <= 200000) {
//     deliveryFee = 11000;
//   } else if (total <= 1000000) {
//     deliveryFee = 13000;
//   } else if (total <= 1500000) {
//     deliveryFee = 18000;
//   } else if (total <= 2000000) {
//     deliveryFee = 20000;
//   } else if (total <= 2500000) {
//     deliveryFee = 22000;
//   } else if (total <= 3000000) {
//     deliveryFee = 24000;
//   } else if (total <= 3500000) {
//     deliveryFee = 26000;
//   } else if (total <= 4000000) {
//     deliveryFee = 28000;
//   } else if (total <= 4500000) {
//     deliveryFee = 32000;
//   } else if (total <= 5000000) {
//     deliveryFee = 34000;
//   } else if (total <= 8000000) {
//     deliveryFee = 36000;
//   } else if (total <= 15000000) {
//     deliveryFee = 40000;
//   } else {
//     deliveryFee = 47000;
//   }

//   return deliveryFee + BASE_FEE;
// };

const TIER_1_BASE = 18000; // Base fee for orders below ₦1M
const TIER_2_BASE = 33000; // Base fee for orders ₦1M and above

const TIER_1_THRESHOLD = 1000000; // ₦1M

const TIER_1_PERCENTAGE = 0.02; // 2% for orders below ₦1M
const TIER_2_PERCENTAGE = 0.01; // 1% for orders ₦1M and above

export const calculateDeliveryFee = (total: number, config?: any) => {
  let deliveryFee: number;

  const threshold = config?.threshold ?? TIER_1_THRESHOLD;
  const base1 = config?.baseFee1 ?? TIER_1_BASE;
  const percentage1 = config?.percentage1 ?? TIER_1_PERCENTAGE;

  // Use the provided config or fallback to constants
  if (total < threshold) {
    // Below threshold → base + % of order value
    deliveryFee = base1 + total * percentage1;
  } else {
    // Threshold and above → TIER_2 (currently using defaults for TIER 2)
    const base2 = config?.baseFee2 ?? TIER_2_BASE;
    const percentage2 = config?.percentage2 ?? TIER_2_PERCENTAGE;
    deliveryFee = base2 + total * percentage2;
  }

  return deliveryFee;
};

export const calculateFrozenDeliveryFee = (
  cartItems: any,
  totalPrice: number,
) => {
  const allFrozen = cartItems.every((item: any) => {
    let product;
    if (!item?.cartProduct) {
      product = item.product;
    } else {
      product = item.cartProduct;
    }
    const categoryId = product?.category?.toString();
    const categoryName = product?.category;
    return (
      categoryId === '6470c46d548ec6b3d1af8fe6' ||
      categoryName === 'Frozen foods'
    );
  });

  // Initialize delivery fee
  let deliveryFee = 0;

  if (allFrozen) {
    if (totalPrice >= 0 && totalPrice <= 149999.99) {
      deliveryFee = 8000;
    } else if (totalPrice >= 150000 && totalPrice <= 249999.99) {
      deliveryFee = 9000;
    } else if (totalPrice >= 250000) {
      deliveryFee = 10000;
    }
  }

  return deliveryFee;
};

export const generateWalletReference = () => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }

  const timestamp = Date.now();

  const result = randomString + timestamp.toString();
  return result.toUpperCase();
};

export const encryptText = (text: string) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY) as Uint8Array;
  const iv = Buffer.from(process.env.ENCRYPTION_IV) as Uint8Array;
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = cipher.update(text);
  const final = cipher.final();
  return Buffer.concat([encrypted, final] as Uint8Array[]).toString('hex');
};

export const generateAccountNumber = () => {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
};

export const getDateFilter = (
  filterType: DateFilterType | undefined,
  customDateRange?: DateRange,
) => {
  const now = new Date();
  const tz = getDashboardTimezone();

  switch (filterType) {
    case 'all_time':
      return {};

    case 'current_date':
      return {
        createdAt: {
          $gte: zonedStartOfDay(now, tz),
          $lte: zonedEndOfDay(now, tz),
        },
      };

    case 'yesterday':
      const yesterday = zonedSubDays(now, 1, tz);
      return {
        createdAt: {
          $gte: zonedStartOfDay(yesterday, tz),
          $lte: zonedEndOfDay(yesterday, tz),
        },
      };

    case 'this_week':
      return {
        createdAt: {
          $gte: zonedStartOfWeek(now, tz),
          $lte: zonedEndOfWeek(now, tz),
        },
      };

    case 'last_week':
      const lastWeek = zonedSubWeeks(now, 1, tz);
      return {
        createdAt: {
          $gte: zonedStartOfWeek(lastWeek, tz),
          $lte: zonedEndOfWeek(lastWeek, tz),
        },
      };

    case 'this_month':
      return {
        createdAt: {
          $gte: zonedStartOfMonth(now, tz),
          $lte: zonedEndOfMonth(now, tz),
        },
      };

    case 'last_month':
      const lastMonth = zonedSubMonths(now, 1, tz);
      return {
        createdAt: {
          $gte: zonedStartOfMonth(lastMonth, tz),
          $lte: zonedEndOfMonth(lastMonth, tz),
        },
      };

    case 'this_year':
      return {
        createdAt: {
          $gte: zonedStartOfYear(now, tz),
          $lte: zonedEndOfYear(now, tz),
        },
      };

    case 'last_year':
      const lastYear = zonedSubYears(now, 1, tz);
      return {
        createdAt: {
          $gte: zonedStartOfYear(lastYear, tz),
          $lte: zonedEndOfYear(lastYear, tz),
        },
      };

    case 'last_7_days':
      return {
        createdAt: {
          $gte: zonedStartOfDay(zonedSubDays(now, 7, tz), tz),
          $lte: zonedEndOfDay(now, tz),
        },
      };

    case 'custom_range':
      if (!customDateRange) {
        throw new BadRequestException('Custom date range is required');
      }

      const startDate =
        typeof customDateRange.start === 'string'
          ? parseISO(customDateRange.start)
          : customDateRange.start;

      const endDate =
        typeof customDateRange.end === 'string'
          ? parseISO(customDateRange.end)
          : customDateRange.end;

      if (!isValid(startDate) || !isValid(endDate)) {
        throw new BadRequestException('Invalid date format in custom range');
      }

      // Handle time filtering for custom range
      let startDateTime: Date;
      let endDateTime: Date;

      if (customDateRange.startTime || customDateRange.endTime) {
        // If time is specified, use it
        if (customDateRange.startTime) {
          const { hours, minutes } = parseTime(customDateRange.startTime);
          startDateTime = new Date(startDate);
          startDateTime.setHours(hours, minutes, 0, 0);
        } else {
          startDateTime = zonedStartOfDay(startDate, tz);
        }

        if (customDateRange.endTime) {
          const { hours, minutes } = parseTime(customDateRange.endTime);
          endDateTime = new Date(endDate);
          endDateTime.setHours(hours, minutes, 59, 999);
        } else {
          endDateTime = zonedEndOfDay(endDate, tz);
        }
      } else {
        // Default to full day range in dashboard timezone
        startDateTime = zonedStartOfDay(startDate, tz);
        endDateTime = zonedEndOfDay(endDate, tz);
      }

      // Validate that end is after start
      if (endDateTime <= startDateTime) {
        throw new BadRequestException(
          'End date/time must be after start date/time',
        );
      }

      return {
        createdAt: {
          $gte: startDateTime,
          $lte: endDateTime,
        },
      };

    default:
      throw new BadRequestException('Invalid filter type');
  }
};

const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);

  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new BadRequestException(
      'Invalid time format. Use HH:mm (24-hour format)',
    );
  }

  return { hours, minutes };
};

export const buildBooleanQuery = (arrValue?: string | (boolean | string)[]) => {
  if (arrValue === undefined) return;
  // Ensure we have an array
  const statusArray = Array.isArray(arrValue) ? arrValue : arrValue.split(',');

  // Normalize values to booleans
  const booleanArray = statusArray.map((status) => {
    // Handle boolean type directly
    if (typeof status === 'boolean') {
      return status;
    }

    // Convert string to boolean
    const normalized = status.toString().trim().toLowerCase();
    return normalized === 'true';
  });

  // Set the query condition
  if (booleanArray.length === 1) {
    return booleanArray[0];
  }

  return { $in: booleanArray };
};

export const getCustomerOrderStats = (orders = []) => {
  if (!orders.length) {
    return {
      totalSpent: 0,
      totalOrders: 0,
      lastOrder: null,
      avgMonthlySpend: 0,
    };
  }
  // totals
  const totalOrders = orders.length;
  const totalSpent = orders.reduce(
    (sum, order) => sum + (order.totalPrice || 0),
    0,
  ) as number;

  // first + last order dates
  const firstOrder = orders[0].createdAt;
  const lastOrder = orders[orders.length - 1].createdAt;

  // months between first and last (inclusive)
  const months =
    (lastOrder.getFullYear() - firstOrder.getFullYear()) * 12 +
    (lastOrder.getMonth() - firstOrder.getMonth()) +
    1;

  const avgMonthlySpend = months > 0 ? totalSpent / months : totalSpent;

  return { totalSpent, totalOrders, lastOrder, avgMonthlySpend };
};

export const daysSince = (date: string) => {
  const now = Date.now();
  const lastTime = new Date(date).getTime();
  return Math.floor((now - lastTime) / (1000 * 60 * 60 * 24));
};
