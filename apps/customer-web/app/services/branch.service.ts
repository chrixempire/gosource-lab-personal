import type {
  BranchListResponse,
  BranchDeleteResponse,
  BranchResponse,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@gosource/api-client';
import { reportCustomerApiError } from '~/utils/api-error';

export function useCustomerBranchService() {
  const { $branchApi } = useNuxtApp();

  return {
    async createBranch(payload: CreateBranchPayload) {
      try {
        return (await $branchApi.createBranch(payload)) as BranchResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to create branch right now');
        throw error;
      }
    },
    async listBranches(query?: { page?: number; limit?: number; search?: string }) {
      try {
        return (await $branchApi.listBranches(query)) as BranchListResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to fetch branches right now');
        throw error;
      }
    },
    async getBranch(branchId: string) {
      try {
        return (await $branchApi.getBranch(branchId)) as BranchResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to load branch right now');
        throw error;
      }
    },
    async updateBranch(branchId: string, payload: UpdateBranchPayload) {
      try {
        return (await $branchApi.updateBranch(branchId, payload)) as BranchResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to update branch right now');
        throw error;
      }
    },
    async activateBranch(branchId: string) {
      try {
        return (await $branchApi.activateBranch(branchId)) as BranchResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to activate branch right now');
        throw error;
      }
    },
    async deactivateBranch(branchId: string) {
      try {
        return (await $branchApi.deactivateBranch(branchId)) as BranchResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to deactivate branch right now');
        throw error;
      }
    },
    async deleteBranch(branchId: string) {
      try {
        return (await $branchApi.deleteBranch(branchId)) as BranchDeleteResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to delete branch right now');
        throw error;
      }
    },
    async makeBranchHeadquarter(branchId: string) {
      try {
        return (await $branchApi.makeBranchHeadquarter(branchId)) as BranchResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to update headquarter right now');
        throw error;
      }
    },
  };
}
