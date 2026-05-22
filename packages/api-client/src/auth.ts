import type { ApiClient } from './client';
import type {
  AdminCompleteSignupPayload,
  AdminLoginPayload,
  AdminPasswordResetCompletePayload,
  AdminPasswordResetRequestPayload,
  AdminRegisterPayload,
  AdminResendInvitePayload,
  AdminVerifyOtpPayload,
  AuthResponse,
  BranchListResponse,
  BranchMembersResponse,
  BranchDeleteResponse,
  BranchResponse,
  CancelEmployeeInviteResponse,
  EmployeeDeleteResponse,
  EmployeeInvitationResponse,
  EmployeeInviteResponse,
  EmployeeMemberResponse,
  EmployeeSetupAccountResponse,
  AddRequestProductPayload,
  ApproveRequestPayload,
  ApproveRequestResponse,
  CreateRequestPayload,
  InviteEmployeePayload,
  ListRequestsQuery,
  CreateBranchPayload,
  RejectRequestPayload,
  RequestListResponse,
  RequestResponse,
  UpdateRequestPayload,
  UpdateRequestProductQuantityPayload,
  UpdateBranchPayload,
  CustomerLoginPayload,
  CustomerAuthResponse,
  CustomerMeResponse,
  CustomerSignupPayload,
  CustomerSessionData,
  ResetPasswordEmailPayload,
  RefreshAuthPayload,
  LogoutPayload,
  ResendEmployeeInvitePayload,
  ResetPasswordPayload,
  SetupEmployeeAccountPayload,
  SetupAccountPayload,
  UpdateEmployeePayload,
  VerifyOtpPayload,
  VerifyResetOtpPayload,
} from './types';

export function createCustomerAuthApi(api: ApiClient) {
  return {
    signup: (payload: CustomerSignupPayload) =>
      api.post<AuthResponse>('/auth/signup', payload),
    resendOtp: (payload: ResetPasswordEmailPayload) =>
      api.post<AuthResponse>('/auth/resend-otp', payload),
    verifyOtp: (payload: VerifyOtpPayload) =>
      api.post<AuthResponse>('/auth/verify-otp', payload),
    login: (payload: CustomerLoginPayload) =>
      api.post<CustomerAuthResponse>('/auth/login', payload),
    setupAccount: (payload: SetupAccountPayload) =>
      api.patch<CustomerAuthResponse>('/auth/setup-account', payload),
    refresh: (payload: RefreshAuthPayload) =>
      api.post<CustomerAuthResponse>('/auth/refresh', payload),
    logout: (payload: LogoutPayload) =>
      api.post<AuthResponse>('/auth/logout', payload),
    me: () => api.get<CustomerMeResponse>('/auth/me'),
    sendPasswordEmail: (payload: ResetPasswordEmailPayload) =>
      api.post<AuthResponse>('/auth/send-password-email', payload),
    verifyPasswordOtp: (payload: VerifyResetOtpPayload) =>
      api.post<AuthResponse>('/auth/verify-password-otp', payload),
    resetPassword: (payload: ResetPasswordPayload) =>
      api.post<AuthResponse>('/auth/reset-password', payload),
  };
}

export function createBranchApi(api: ApiClient) {
  return {
    listBranches: (query?: { page?: number; limit?: number; search?: string }) =>
      api.get<BranchListResponse>(
        `/branch?page=${query?.page ?? 1}&limit=${query?.limit ?? 10}${query?.search ? `&search=${encodeURIComponent(query.search)}` : ''}`,
      ),
    getBranch: (branchId: string) =>
      api.get<BranchResponse>(`/branch/${branchId}`),
    createBranch: (payload: CreateBranchPayload) =>
      api.post<BranchResponse>('/branch', payload),
    updateBranch: (branchId: string, payload: UpdateBranchPayload) =>
      api.patch<BranchResponse>(`/branch/${branchId}`, payload),
    activateBranch: (branchId: string) =>
      api.patch<BranchResponse>(`/branch/${branchId}/activate`),
    deactivateBranch: (branchId: string) =>
      api.patch<BranchResponse>(`/branch/${branchId}/deactivate`),
    deleteBranch: (branchId: string) =>
      api.delete<BranchDeleteResponse>(`/branch/${branchId}`),
  };
}

export function createEmployeeApi(api: ApiClient) {
  return {
    inviteEmployee: (payload: InviteEmployeePayload) =>
      api.post<EmployeeInviteResponse>('/employee/invite', payload),
    listBranchMembers: (branchId: string, query?: { page?: number; limit?: number; search?: string }) => {
      const params = new URLSearchParams();
      params.set('page', String(query?.page ?? 1));
      params.set('limit', String(query?.limit ?? 10));
      const search = query?.search?.trim();
      if (search) {
        params.set('search', search);
      }

      return api.get<BranchMembersResponse>(`/employee/branch/${branchId}?${params.toString()}`);
    },
    getInvitationDetails: (invitationId: string, token: string) =>
      api.get<EmployeeInvitationResponse>(`/employee/invite/${invitationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    setupEmployeeAccount: (payload: SetupEmployeeAccountPayload, token: string) =>
      api.post<EmployeeSetupAccountResponse>('/employee/setup-account', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    cancelEmployeeInvite: (invitationId: string) =>
      api.delete<CancelEmployeeInviteResponse>(`/employee/invite/${invitationId}`),
    resendEmployeeInvite: (invitationId: string, payload?: ResendEmployeeInvitePayload) =>
      api.post<EmployeeInviteResponse>(`/employee/invite/${invitationId}/resend`, payload ?? {}),
    refreshEmployeeInviteLink: (invitationId: string) =>
      api.post<EmployeeInviteResponse>(`/employee/invite/${invitationId}/link`, {}),
    getEmployee: (employeeId: string) => api.get<EmployeeMemberResponse>(`/employee/${employeeId}`),
    deleteEmployee: (employeeId: string) =>
      api.delete<EmployeeDeleteResponse>(`/employee/${employeeId}`),
    updateEmployee: (employeeId: string, payload: UpdateEmployeePayload) =>
      api.patch<EmployeeMemberResponse>(`/employee/${employeeId}`, payload),
    deactivateEmployee: (employeeId: string) =>
      api.patch<EmployeeMemberResponse>(`/employee/${employeeId}/deactivate`, {}),
    reactivateEmployee: (employeeId: string) =>
      api.patch<EmployeeMemberResponse>(`/employee/${employeeId}/reactivate`, {}),
  };
}

export function createRequestApi(api: ApiClient) {
  return {
    createRequest: (payload: CreateRequestPayload) =>
      api.post<RequestResponse>('/request', payload),
    createRequestFromShoppingList: (listId: string, payload: CreateRequestPayload) =>
      api.post<RequestResponse>(`/request/shopping-list/${listId}`, payload),
    listRequests: (query?: ListRequestsQuery) => {
      const params = new URLSearchParams();
      params.set('page', String(query?.page ?? 1));
      params.set('limit', String(query?.limit ?? 10));
      const search = query?.search?.trim();
      if (search) {
        params.set('search', search);
      }
      if (query?.status) {
        params.set('status', query.status);
      }
      if (query?.branchId) {
        params.set('branchId', query.branchId);
      }

      return api.get<RequestListResponse>(`/request?${params.toString()}`);
    },
    getRequest: (requestId: string) =>
      api.get<RequestResponse>(`/request/${requestId}`),
    approveRequest: (requestId: string, payload?: ApproveRequestPayload) =>
      api.patch<ApproveRequestResponse>(`/request/${requestId}/approve`, payload ?? {}),
    rejectRequest: (requestId: string, payload: RejectRequestPayload) =>
      api.patch<RequestResponse>(`/request/${requestId}/reject`, payload),
    cancelRequest: (requestId: string) =>
      api.patch<RequestResponse>(`/request/${requestId}/cancel`, {}),
    updateRequestProductQuantity: (payload: UpdateRequestProductQuantityPayload) =>
      api.patch<RequestResponse>('/request/update-product-quantity', payload),
    removeRequestProduct: (requestId: string, cartLineId: string) =>
      api.delete<RequestResponse>(`/request/${requestId}/product/${cartLineId}`),
    addRequestProduct: (requestId: string, payload: AddRequestProductPayload) =>
      api.patch<RequestResponse>(`/request/add-product/${requestId}`, payload),
    updateRequest: (requestId: string, payload: UpdateRequestPayload) =>
      api.patch<RequestResponse>(`/request/${requestId}`, payload),
  };
}

export function createAdminAuthApi(api: ApiClient) {
  return {
    register: (payload: AdminRegisterPayload) =>
      api.post<AuthResponse>('/admin/auth/register', payload),
    completeAdminSignup: (payload: AdminCompleteSignupPayload) =>
      api.patch<AuthResponse>('/admin/auth/complete-admin-signup', payload),
    login: (payload: AdminLoginPayload) =>
      api.post<AuthResponse>('/admin/auth/login', payload),
    initiatePasswordReset: (payload: AdminPasswordResetRequestPayload) =>
      api.post<AuthResponse>('/admin/auth/initiate-password-reset', payload),
    completePasswordReset: (payload: AdminPasswordResetCompletePayload) =>
      api.post<AuthResponse>('/admin/auth/complete-password-reset', payload),
    verifyOtp: (payload: AdminVerifyOtpPayload) =>
      api.post<AuthResponse>('/admin/auth/verify-otp', payload),
    resendInvite: (payload: AdminResendInvitePayload) =>
      api.post<AuthResponse>('/admin/auth/resend-invite', payload),
  };
}
