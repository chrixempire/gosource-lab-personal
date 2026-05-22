export const BUSINESS_CUSTOMER_COLLECTION = 'businesscustomers';

export type BusinessCustomerRole = 'super_admin';

export interface BusinessCustomerDocument {
  _id: string;
  businessId: string;
  businessName: string;
  firstName: string;
  lastName: string;
  phoneNumbers: string[];
  normalizedPhoneNumbers: string[];
  email: string;
  type: 'BUSINESS';
  passwordHash: string | null;
  verified: boolean;
  verifiedAt: Date | null;
  isDeactivated: boolean;
  role: BusinessCustomerRole;
  status: 'pending_verification' | 'pending_setup' | 'active' | 'inactive';
  onboardingStep: number;
  createdAt: Date;
  updatedAt: Date;
}

export const businessCustomerIndexes = [
  { key: { email: 1 }, options: { unique: true } },
  { key: { normalizedPhoneNumbers: 1 }, options: { unique: true, sparse: true } },
] as const;
