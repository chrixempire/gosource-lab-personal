export const REQUEST_COLLECTION = 'requests';

export type RequestUserType = 'customer' | 'employee';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type RequestPaymentStatus = 'pending' | 'paid';

export interface RequestAddressDocument {
  streetAddress: string;
  directions?: string;
  state: string;
  lga: string;
}

export interface RequestProductDocument {
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string | null;
  imageUrl?: string | null;
  inStock?: boolean;
}

export interface RequestActorDocument {
  accountId: string;
  user_type: RequestUserType;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;
  branchId?: string | null;
}

export interface RequestDocument {
  _id: string;
  businessId: string;
  branchId: string;
  branchName: string;
  reference: string;
  status: RequestStatus;
  paymentStatus: RequestPaymentStatus;
  paymentMethod: string | null;
  initiator: RequestActorDocument;
  approver: RequestActorDocument | null;
  rejectedBy: RequestActorDocument | null;
  rejectedReasons: string | null;
  address: RequestAddressDocument;
  phoneNumber: string;
  products: RequestProductDocument[];
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  totalPrice: number;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const requestIndexes = [
  { key: { businessId: 1, createdAt: -1 }, options: {} },
  { key: { branchId: 1, createdAt: -1 }, options: {} },
  { key: { status: 1, createdAt: -1 }, options: {} },
  { key: { reference: 1 }, options: { unique: true } },
] as const;
