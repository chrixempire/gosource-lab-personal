import type {
  BranchMembersResponse,
  CancelEmployeeInviteResponse,
  EmployeeDeleteResponse,
  EmployeeInvitationResponse,
  EmployeeInviteResponse,
  EmployeeMemberResponse,
  EmployeeSetupAccountResponse,
  InviteEmployeePayload,
  ResendEmployeeInvitePayload,
  SetupEmployeeAccountPayload,
  UpdateEmployeePayload,
} from '@gosource/api-client';
import { reportCustomerApiError } from '~/utils/api-error';

export function useCustomerEmployeeService() {
  const { $employeeApi } = useNuxtApp();

  return {
    async inviteEmployee(payload: InviteEmployeePayload) {
      try {
        return (await $employeeApi.inviteEmployee(payload)) as EmployeeInviteResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to send invitation right now');
        throw error;
      }
    },
    async listBranchMembers(branchId: string, query?: { page?: number; limit?: number; search?: string }) {
      try {
        return (await $employeeApi.listBranchMembers(branchId, query)) as BranchMembersResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to load members right now');
        throw error;
      }
    },
    async cancelEmployeeInvite(invitationId: string) {
      try {
        return (await $employeeApi.cancelEmployeeInvite(invitationId)) as CancelEmployeeInviteResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to cancel invitation right now');
        throw error;
      }
    },
    async resendEmployeeInvite(invitationId: string, payload?: ResendEmployeeInvitePayload) {
      try {
        return (await $employeeApi.resendEmployeeInvite(invitationId, payload)) as EmployeeInviteResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to resend invitation right now');
        throw error;
      }
    },
    async refreshEmployeeInviteLink(invitationId: string) {
      try {
        return (await $employeeApi.refreshEmployeeInviteLink(invitationId)) as EmployeeInviteResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to refresh invite link right now');
        throw error;
      }
    },
    async getEmployee(employeeId: string) {
      try {
        return (await $employeeApi.getEmployee(employeeId)) as EmployeeMemberResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to load member right now');
        throw error;
      }
    },
    async deleteEmployee(employeeId: string) {
      try {
        return (await $employeeApi.deleteEmployee(employeeId)) as EmployeeDeleteResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to remove member right now');
        throw error;
      }
    },
    async updateEmployee(employeeId: string, payload: UpdateEmployeePayload) {
      try {
        return (await $employeeApi.updateEmployee(employeeId, payload)) as EmployeeMemberResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to update member right now');
        throw error;
      }
    },
    async deactivateEmployee(employeeId: string) {
      try {
        return (await $employeeApi.deactivateEmployee(employeeId)) as EmployeeMemberResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to deactivate member right now');
        throw error;
      }
    },
    async reactivateEmployee(employeeId: string) {
      try {
        return (await $employeeApi.reactivateEmployee(employeeId)) as EmployeeMemberResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to activate member right now');
        throw error;
      }
    },
    async getInvitationDetails(invitationId: string, token: string) {
      try {
        return (await $employeeApi.getInvitationDetails(
          invitationId,
          token,
        )) as EmployeeInvitationResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to load invitation right now');
        throw error;
      }
    },
    async setupEmployeeAccount(payload: SetupEmployeeAccountPayload, token: string) {
      try {
        return (await $employeeApi.setupEmployeeAccount(
          payload,
          token,
        )) as EmployeeSetupAccountResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to complete employee setup right now');
        throw error;
      }
    },
  };
}
