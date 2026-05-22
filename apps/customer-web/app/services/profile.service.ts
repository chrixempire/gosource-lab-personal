import type { BranchRecord, CustomerMeResponse, UpdateEmployeePayload } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { extractApiErrorMessage } from '~/utils/api-error';

export type UpdateMyProfilePayload = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type BusinessAccountRecord = {
  id: string;
  businessName: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  branchId?: string | null;
  createdAt?: string;
};

export function useCustomerProfileService() {
  const { $apiClient, $employeeApi } = useNuxtApp();
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);

  return {
    async getBusinessAccount() {
      try {
        const response = await $apiClient.get<{
          data?: Record<string, unknown>;
        }>('/business');

        const data = response.data;
        if (!data) {
          return null;
        }

        return {
          id: String(data._id ?? data.id ?? ''),
          businessName: String(data.businessName ?? ''),
          email: String(data.email ?? ''),
          firstName: data.firstName ? String(data.firstName) : null,
          lastName: data.lastName ? String(data.lastName) : null,
          phoneNumber: data.phoneNumber ? String(data.phoneNumber) : null,
          branchId: data.branchId ? String(data.branchId) : null,
          createdAt: data.createdAt ? String(data.createdAt) : undefined,
        } satisfies BusinessAccountRecord;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to load business profile'));
        throw error;
      }
    },

    async updateMyProfile(payload: UpdateMyProfilePayload) {
      try {
        if (isBusinessOwnerSession(session.value)) {
          return await $apiClient.patch<{ message?: string }>('/business/change-phone-number', {
            firstName: payload.firstName,
            lastName: payload.lastName,
            newPhoneNumber: payload.phoneNumber,
          });
        }

        const employeeId = session.value?.data?.id;
        if (!employeeId) {
          throw new Error('No active session');
        }

        const body: UpdateEmployeePayload = {
          firstName: payload.firstName,
          lastName: payload.lastName,
          phoneNumber: payload.phoneNumber,
        };

        return await $employeeApi.updateEmployee(employeeId, body);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to update profile right now'));
        throw error;
      }
    },

    async changePassword(payload: ChangePasswordPayload) {
      try {
        return await $apiClient.patch<{ message?: string }>('/business/change-password', payload);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to change password right now'));
        throw error;
      }
    },

    async sendEmailOtp(email: string) {
      try {
        return await $apiClient.post<{ message?: string }>('/business/send-otp', { email });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to send verification code'));
        throw error;
      }
    },

    async verifyEmailOtp(email: string, otp: string) {
      try {
        return await $apiClient.post<{ message?: string }>('/business/verify-otp', {
          email,
          otp,
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to verify email'));
        throw error;
      }
    },
  };
}

export function formatSettingsDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatBranchAddress(branch: BranchRecord | null) {
  if (!branch) {
    return '—';
  }

  const state = branch.state?.trim() || 'Lagos';
  return `${branch.streetName}, ${branch.lga}, ${state}.`;
}
