export type PurchaseOrderStatus = 'pending' | 'partial' | 'complete';
export type PurchaseOrderProductType = 'perishable' | 'non-perishable';

export type PurchaseOrderListFilters = {
  id: string;
  status: PurchaseOrderStatus[];
  productType: PurchaseOrderProductType[];
  startDate: string;
  endDate: string;
  expectedDateFrom: string;
  expectedDateTo: string;
  page: number;
  limit: number;
};

export type PurchaseOrderListStats = {
  totalDocuments: number;
  totalPrice: number;
  totalLogistics: number;
  pendingCount: number;
  partialCount: number;
  completeCount: number;
};

export type AdminPurchaseOrderListItem = {
  id: string;
  referenceLabel: string;
  createdAt: string | null;
  createdAtLabel: string;
  productType: PurchaseOrderProductType | string;
  productTypeLabel: string;
  status: PurchaseOrderStatus | string;
  statusLabel: string;
  itemsCount: number;
  itemsTotal: number;
  itemsTotalLabel: string;
  quantityOrdered: number;
  quantityReceived: number;
  receivePercent: number;
  expectedDate: string | null;
  expectedDateLabel: string;
  expectedDateOverdue: boolean;
  invoicePreview: PurchaseOrderInvoicePreview;
};

export type PurchaseOrderSupplierOption = {
  id: string;
  label: string;
  email: string;
};

export type PurchaseOrderLineItem = {
  productId: string;
  name: string;
  categoryLabel: string;
  imageUrl: string | null;
  quantity: number;
  quantityReceived: number;
  unitPrice: number;
  totalPrice: number;
};

export type PurchaseOrderFormValues = {
  productType: PurchaseOrderProductType | '';
  expectedDate: string;
  note: string;
  logisticsAmount: string;
  suppliers: string[];
  lineItems: PurchaseOrderLineItem[];
};

export type PurchaseOrderInvoicePreview = {
  referenceLabel: string;
  expectedDateLabel: string;
  orderedByLabel: string;
  billTo: { name: string; email: string }[];
  note: string;
  logisticsAmount: number;
  lineItems: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  total: number;
};

export type PurchaseOrderReceiveRow = {
  productId: string;
  name: string;
  categoryLabel: string;
  ordered: number;
  received: number;
  toReceive: string;
  error: string;
};

export type LegacyPurchaseOrderRow = {
  _id?: string;
  id?: string;
  createdAt?: string;
  expectedDate?: string;
  productType?: string;
  status?: string;
  note?: string;
  logisticsAmount?: number;
  products?: Array<{
    product?: {
      _id?: string;
      id?: string;
      name?: string;
      image?: string;
      category?: { name?: string };
      categoryInfo?: { name?: string };
    };
    quantity?: number;
    quantityReceived?: number;
    totalPrice?: number;
  }>;
  suppliers?: Array<{
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }>;
  creator?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};
