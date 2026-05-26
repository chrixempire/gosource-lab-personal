export interface ApiClientOptions {
  baseURL?: string;
  defaultHeaders?: HeadersInit;
  getDefaultHeaders?: () => HeadersInit | undefined;
  getAuthToken?: () => string | null | undefined;
  onAuthRefresh?: () => Promise<string | null | undefined>;
  onAuthFailure?: (error: ApiError) => void | Promise<void>;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export interface AuthResponse<TData = unknown> {
  message?: string;
  data?: TData;
  token?: string;
  access_token?: string;
  refresh_token?: string;
}

export interface EmployeeSessionData {
  id: string;
  businessId: string;
  branchId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  position: string;
  role: string;
  status: string;
}

export interface CustomerSessionData {
  id: string;
  businessId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: 'super_admin';
  status: string;
  onboardingStep?: number;
}

export interface CustomerAuthResponse extends AuthResponse<CustomerSessionData | EmployeeSessionData> {
  user_type: 'customer' | 'employee';
  access_token: string;
  refresh_token?: string;
}

export interface CustomerMeResponse extends AuthResponse<CustomerSessionData | EmployeeSessionData> {
  user_type: 'customer' | 'employee';
}

export interface CustomerSignupPayload {
  email: string;
  businessName: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  accountType?: string;
}

export interface CustomerLoginPayload {
  email: string;
  password: string;
}

export interface RefreshAuthPayload {
  refreshToken: string;
}

export interface LogoutPayload {
  refreshToken: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordEmailPayload {
  email: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  token: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
}

export interface SetupAccountPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber: string;
}

export interface CreateBranchPayload {
  branchName: string;
  streetName: string;
  lga: string;
}

export interface UpdateBranchPayload {
  branchName: string;
  streetName: string;
  lga: string;
}

export interface BranchRecord {
  id: string;
  businessId: string;
  branchName: string;
  branchCode: string;
  streetName: string;
  lga: string;
  state: string;
  isHeadquarter: boolean;
  isDeactivated: boolean;
  activatedAt: string | null;
  totalAmountProcured: number;
  totalItemsPurchased: number;
  totalOrders: number;
  /** Employee accounts plus pending invites on this branch. */
  membersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BranchResponse extends AuthResponse<BranchRecord> {
  status?: boolean;
}

export interface BranchDeleteResponse extends AuthResponse<{ id: string }> {
  status?: boolean;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BranchListResponse extends AuthResponse<BranchRecord[]> {
  status?: boolean;
  meta: PaginatedMeta;
}

export type EmployeeRole = 'manager' | 'employee';

export interface InviteEmployeePayload {
  email: string;
  role: EmployeeRole;
  branchId: string;
  callbackUrl: string;
}

export type ResendEmployeeInvitePayload = {
  email?: string;
  role?: EmployeeRole;
};

export type UpdateEmployeePayload = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: EmployeeRole;
  position?: string;
  branchId?: string;
};

export interface EmployeeInviteData {
  invitationId: string;
  email: string;
  role: string;
  branchId: string;
  activationUrl: string;
}

export interface EmployeeInviteResponse extends AuthResponse<EmployeeInviteData> {}

export interface CancelEmployeeInviteResponse extends AuthResponse<{ invitationId: string }> {}

export interface EmployeeMemberDetail {
  id: string;
  businessId: string;
  branchId: string;
  email: string;
  role: string;
  position: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeMemberResponse extends AuthResponse<EmployeeMemberDetail> {}

export interface EmployeeDeleteResponse extends AuthResponse<{ id: string }> {}

export interface BranchMemberRecord {
  id: string;
  kind: 'member' | 'invite';
  email: string;
  firstName: string | null;
  lastName: string | null;
  position: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface BranchMembersResponse extends AuthResponse<BranchMemberRecord[]> {
  meta: PaginatedMeta;
}

export interface EmployeeInvitationData {
  invitationId: string;
  email: string;
  role: string;
  branchId: string;
  branchName: string | null;
  businessName: string | null;
}

export interface EmployeeInvitationResponse extends AuthResponse<EmployeeInvitationData> {}

export interface SetupEmployeeAccountPayload {
  firstName: string;
  lastName: string;
  position: string;
  phoneNumber: string;
  password: string;
}

export interface EmployeeSetupAccountResponse extends AuthResponse<EmployeeSessionData> {
  access_token: string;
}

export interface RequestAddressPayload {
  streetAddress: string;
  directions?: string;
  state: string;
  lga: string;
}

export interface RequestProductPayload {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  imageUrl?: string;
}

export interface CreateRequestPayload {
  branchId: string;
  address: RequestAddressPayload;
  phoneNumber: string;
  paymentMethod?: string;
  deliveryFee?: number;
  serviceCharge?: number;
  discount?: number;
  /** Omitted in legacy mode — the API builds the request from the branch cart. */
  products?: RequestProductPayload[];
}

export interface RequestActorRecord {
  accountId: string;
  user_type: 'customer' | 'employee';
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;
  branchId?: string | null;
}

export interface RequestAddressRecord {
  streetAddress: string;
  directions?: string;
  state: string;
  lga: string;
}

export interface RequestProductRecord {
  /** Legacy cart line id — required for quantity/remove mutations. */
  cartLineId?: string | null;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string | null;
  imageUrl?: string | null;
  inStock?: boolean;
}

export interface UpdateRequestProductQuantityPayload {
  requestId: string;
  /** Legacy cart line id on the request.products entry. */
  cartId: string;
  quantity: number;
}

export interface AddRequestProductPayload {
  productId: string;
  quantity: number;
  unit: string;
  requestId?: string;
}

export interface UpdateRequestPayload {
  status?: RequestRecord['status'];
  paymentMethod?: string;
  phoneNumber?: string;
  address?: RequestAddressPayload;
  branch?: string;
  deliveryFee?: number;
  serviceCharge?: number;
}

export interface RequestRecord {
  id: string;
  businessId: string;
  branchId: string;
  branchName: string;
  branchCode: string | null;
  reference: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  paymentMethod: string | null;
  initiator: RequestActorRecord;
  approver: RequestActorRecord | null;
  rejectedBy: RequestActorRecord | null;
  rejectedReasons: string | null;
  address: RequestAddressRecord;
  phoneNumber: string;
  products: RequestProductRecord[];
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  totalPrice: number;
  approvedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestResponse extends AuthResponse<RequestRecord> {
  status?: boolean;
}

export interface RequestListResponse extends AuthResponse<RequestRecord[]> {
  status?: boolean;
  meta: PaginatedMeta;
}

export interface ListRequestsQuery {
  page?: number;
  limit?: number;
  search?: string;
  /** Single status or comma-separated list (pending,approved,…). */
  status?: string;
  branchId?: string;
  amountFrom?: number;
  amountTo?: number;
}

export interface ApproveRequestPayload {
  paymentStatus?: RequestRecord['paymentStatus'];
  paymentMethod?: string;
}

export interface ApproveRequestResponse extends RequestResponse {
  orderId: string | null;
}

export type WalletTransactionType = 'credit' | 'debit';
export type WalletTransactionStatus = 'successful' | 'pending' | 'cancelled';

export interface WalletRecord {
  id: string;
  reference: string;
  balance: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  active: boolean;
  createdAt: string;
}

export interface WalletTransactionRecord {
  id: string;
  reference: string;
  amount: number;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  description: string;
  paymentReference: string;
  createdAt: string;
}

export interface WalletTransactionsListData {
  transactions: WalletTransactionRecord[];
  totalTransactions: number;
  meta: {
    page: number;
    limit: number;
  };
}

export interface WalletResponse extends AuthResponse<WalletRecord> {
  status?: boolean;
}

export interface WalletTransactionsResponse extends AuthResponse<WalletTransactionsListData> {
  status?: boolean;
}

export interface VerifyBvnPayload {
  bvn: string;
}

export interface VerifyBvnData {
  phoneNumber?: string;
}

export interface VerifyBvnResponse extends AuthResponse<VerifyBvnData> {
  status?: boolean;
}

export interface CreateWalletPayload {
  bvn: string;
  otp: string;
}

export interface FundWalletPayload {
  amount: number;
  transactionReference: string;
}

export interface RejectRequestPayload {
  reason: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  callbackUrl?: string;
}

export interface AdminCompleteSignupPayload {
  password: string;
}

export interface AdminPasswordResetRequestPayload {
  email: string;
}

export interface AdminPasswordResetCompletePayload {
  email: string;
  token: string;
  password: string;
}

export interface AdminVerifyOtpPayload {
  email: string;
  token: string;
}

export interface AdminResendInvitePayload {
  userId: string;
  callbackUrl: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'partially_delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded'
  | 'completed'
  | 'accepted'
  | 'ready';

export type OrderPaymentStatus = 'pending' | 'paid' | 'cancelled' | 'partial';

export type OrderProductRecord = RequestProductRecord;

export interface OrderTimelineRecord {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: string | null;
  businessId: string;
  branchId: string;
  branchName: string;
  requestId: string | null;
  initiator: RequestActorRecord | null;
  phoneNumber: string;
  address: RequestAddressRecord;
  products: OrderProductRecord[];
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
}

export interface OrderDetailRecord extends OrderRecord {
  timeline?: OrderTimelineRecord[];
}

export interface OrderResponse extends AuthResponse<OrderDetailRecord> {
  status?: boolean;
}

export interface OrderListResponse extends AuthResponse<OrderRecord[]> {
  status?: boolean;
  meta: PaginatedMeta;
}

export interface OrderTimelineResponse extends AuthResponse<OrderTimelineRecord[]> {
  status?: boolean;
}

export interface ListOrdersQuery {
  page?: number;
  limit?: number;
  /** Comma-separated order statuses for server-side tab filtering. */
  status?: string;
  /** When set (super admin), limits orders to this branch; omit for all branches. */
  branchId?: string;
  amountFrom?: number;
  amountTo?: number;
  filterBy?: string;
  filterValue?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ShoppingListItemRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
  inStock: boolean;
}

export interface ShoppingListRecord {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  description: string | null;
  items: ShoppingListItemRecord[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListResponse extends AuthResponse<ShoppingListRecord> {
  status?: boolean;
}

export interface ShoppingListListResponse extends AuthResponse<ShoppingListRecord[]> {
  status?: boolean;
}

export interface ShoppingListMoveResponse extends AuthResponse<{ movedItems: number }> {
  status?: boolean;
}

export interface CreateShoppingListPayload {
  branchId: string;
  name: string;
  description?: string;
}

export interface UpdateShoppingListPayload {
  branchId?: string;
  name?: string;
  description?: string;
}

export interface AddShoppingListItemPayload {
  productId: string;
  quantity: number;
  unit: string;
}

export interface UpdateShoppingListItemPayload {
  quantity: number;
  unit?: string;
}

export interface MoveShoppingListItemsPayload {
  targetListId: string;
  itemIds: string[];
}
