import { BadRequestException } from '@nestjs/common';
import type { Model } from 'mongoose';

export function normalizePhoneNumber(value: string): string {
  return String(value ?? '').replace(/\D/g, '');
}

type PhoneRow = { _id?: unknown; phoneNumber?: string | null };

async function findRowWithNormalizedPhone<T extends PhoneRow>(
  model: Model<T>,
  normalized: string,
  excludeId?: string,
): Promise<T | null> {
  if (!normalized) {
    return null;
  }

  const filter: Record<string, unknown> = {
    phoneNumber: { $exists: true, $nin: [null, ''] },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const rows = await model.find(filter).select('_id phoneNumber').lean<T[]>();

  for (const row of rows) {
    if (normalizePhoneNumber(row.phoneNumber ?? '') === normalized) {
      return row;
    }
  }

  return null;
}

export type PhoneAvailabilityExclude = {
  employeeId?: string;
  businessId?: string;
};

/**
 * Ensures a phone number is not already used by any business (super admin) or employee account.
 * Comparison uses digits-only normalization so formats like +234… and 080… match.
 */
export async function assertPhoneNumberAvailable(
  phoneNumber: string,
  deps: {
    employeeModel: Model<PhoneRow>;
    businessModel: Model<PhoneRow>;
  },
  exclude?: PhoneAvailabilityExclude,
): Promise<void> {
  const normalized = normalizePhoneNumber(phoneNumber);

  if (!normalized) {
    throw new BadRequestException('Phone number is required');
  }

  const existingEmployee = await findRowWithNormalizedPhone(
    deps.employeeModel,
    normalized,
    exclude?.employeeId,
  );
  if (existingEmployee) {
    throw new BadRequestException(
      'This phone number is already being used by another team member',
    );
  }

  const existingBusiness = await findRowWithNormalizedPhone(
    deps.businessModel,
    normalized,
    exclude?.businessId,
  );
  if (existingBusiness) {
    throw new BadRequestException(
      'This phone number is already being used by another account in GoSource',
    );
  }
}
