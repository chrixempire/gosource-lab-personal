export type CustomerAccountType = 'business' | 'individual';

export type CustomerListFilters = {
  search: string;
  accountType: CustomerAccountType[];
  status: ('active' | 'inactive')[];
  useCredit: ('enabled' | 'disabled')[];
  amountMin: string;
  amountMax: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
};

export type AdminCustomerListItem = {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  accountType: CustomerAccountType | string;
  accountTypeLabel: string;
  status: 'active' | 'inactive';
  statusLabel: string;
  useCredit: boolean;
  createdAt: string | null;
  createdAtLabel: string;
  initials: string;
};

export type LegacyCustomerRow = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phoneNumber?: string;
  accountType?: string;
  active?: boolean;
  canBuyOnCredit?: boolean;
  createdAt?: string;
  amount?: number;
};

export type CustomerDetailView = {
  id: string;
  displayName: string;
  contactName: string;
  imageUrl: string | null;
  email: string;
  phoneNumber: string;
  accountType: string;
  status: 'active' | 'inactive';
  statusLabel: string;
  useCredit: boolean;
  createdAtLabel: string;
  totalOrders: number;
  totalSpent: number;
  totalBranches: number;
  totalEmployees: number;
  walletBalance: number | null;
  walletCurrency: string | null;
  wallet: {
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
    balance: number | null;
  } | null;
};

export type CustomerWalletTransaction = {
  id: string;
  reference: string;
  description: string;
  amountLabel: string;
  typeLabel: string;
  statusLabel: string;
  createdAtLabel: string;
};

export type CustomerBranchItem = {
  id: string;
  name: string;
  address: string;
  statusLabel: string;
  isHeadquarter: boolean;
  membersCount: number;
  totalSpentLabel: string;
  createdAtLabel: string;
};
