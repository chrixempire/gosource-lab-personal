import type { CustomerAccountType } from '~/types/customers';

export const CUSTOMER_ACCOUNT_TYPES: { value: CustomerAccountType; label: string }[] = [
  { value: 'business', label: 'Business' },
  { value: 'individual', label: 'Individual' },
];

export const CUSTOMER_STATUS_OPTIONS = [
  { value: 'active' as const, label: 'Active', variant: 'success' as const },
  { value: 'inactive' as const, label: 'Inactive', variant: 'negative' as const },
];

export const CUSTOMER_CREDIT_OPTIONS = [
  { value: 'enabled' as const, label: 'Credit enabled', variant: 'success' as const },
  { value: 'disabled' as const, label: 'Credit disabled', variant: 'default' as const },
];

export const CUSTOMER_QUICK_STAT_FILTERS: {
  key: 'all' | CustomerAccountType;
  label: string;
}[] = [
  { key: 'all', label: 'All customers' },
  { key: 'business', label: 'Business customers' },
  { key: 'individual', label: 'Individual customers' },
];

export function customerStatusVariant(status: string) {
  return status === 'active' ? 'success' : 'negative';
}

export function customerAccountTypeVariant(accountType: string) {
  return accountType === 'individual' ? 'accepted' : 'success';
}

export function customerAccountTypeLabel(type: string) {
  return CUSTOMER_ACCOUNT_TYPES.find((entry) => entry.value === type)?.label ?? type;
}
