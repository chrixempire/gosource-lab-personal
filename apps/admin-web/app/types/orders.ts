export type OrderPaymentMethod = 'Credit' | 'Transfer' | 'Wallet' | 'Paystack' | string;

export type OrderPaymentStatus =
  | 'pending'
  | 'partial'
  | 'paid'
  | 'cancelled'
  | 'refunded'
  | string;

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'processing'
  | 'ready'
  | 'shipped'
  | 'partially_delivered'
  | 'delivered'
  | 'cancelled'
  | string;

export type OrderListFilters = {
  amountMin: number | null;
  amountMax: number | null;
  business: string;
  paymentMethod: string[];
  paymentStatus: string[];
  status: string[];
  startDate: string;
  endDate: string;
  reference: string;
  page: number;
  limit: number;
};

export type OrderTableMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type LegacyOrderBusiness = {
  _id?: string;
  businessName?: string;
};

export type LegacyOrderRow = {
  _id: string;
  reference?: string;
  createdAt?: string;
  totalPrice?: number;
  paymentMethod?: OrderPaymentMethod;
  paymentStatus?: OrderPaymentStatus;
  status?: OrderStatus;
  products?: unknown[];
  business?: LegacyOrderBusiness | string;
};

export type AdminOrderListItem = {
  id: string;
  reference: string;
  referenceLabel: string;
  createdAt: string;
  createdLabel: string;
  itemCount: number;
  itemCountLabel: string;
  totalPrice: number;
  totalLabel: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentStatus: OrderPaymentStatus;
  paymentStatusLabel: string;
  paymentStatusVariant: 'default' | 'success' | 'negative' | 'warning';
  status: OrderStatus;
  statusLabel: string;
  statusVariant:
    | 'default'
    | 'info'
    | 'success'
    | 'negative'
    | 'warning'
    | 'completed'
    | 'glory'
    | 'ready'
    | 'partiallyDelivered'
    | 'accepted';
  customerId: string;
  customerName: string;
  /** Whether the order's items can still be edited (not delivered/shipped/cancelled). */
  isEditable: boolean;
  /** Whether the order already has items added after creation. */
  hasAdditionalItems: boolean;
};

export type OrderCustomerOption = {
  id: string;
  label: string;
};
