import type {
  CreateWalletPayload,
  FundWalletPayload,
  VerifyBvnPayload,
  VerifyBvnResponse,
  WalletRecord,
  WalletResponse,
  WalletTransactionsResponse,
} from '@gosource/api-client';
import { reportCustomerApiError } from '~/utils/api-error';

function isNotFoundError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    Number((error as { status: number }).status) === 404
  );
}

export function useCustomerWalletService() {
  const { $walletApi } = useNuxtApp();

  return {
    async getWallet(options?: { silent?: boolean }): Promise<WalletRecord | null> {
      try {
        const response = (await $walletApi.getWallet()) as WalletResponse;
        return response.data ?? null;
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }
        if (!options?.silent) {
          reportCustomerApiError(error, 'Unable to load wallet right now');
        }
        throw error;
      }
    },
    async verifyBvn(payload: VerifyBvnPayload) {
      try {
        return (await $walletApi.verifyBvn(payload)) as VerifyBvnResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to verify BVN right now');
        throw error;
      }
    },
    async createWallet(payload: CreateWalletPayload) {
      try {
        return (await $walletApi.createWallet(payload)) as WalletResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to create wallet right now');
        throw error;
      }
    },
    async fundWallet(payload: FundWalletPayload) {
      try {
        return await $walletApi.fundWallet(payload);
      } catch (error) {
        reportCustomerApiError(error, 'Unable to fund wallet right now');
        throw error;
      }
    },
    async listTransactions(
      query?: { page?: number; limit?: number },
      options?: { silent?: boolean },
    ) {
      try {
        return (await $walletApi.listTransactions(query)) as WalletTransactionsResponse;
      } catch (error) {
        if (!options?.silent) {
          reportCustomerApiError(error, 'Unable to load transactions right now');
        }
        throw error;
      }
    },
    /** Local dev only — simulates Paystack webhook confirmation when webhooks cannot reach localhost. */
    async devConfirmFunding(payload: { paymentReference: string; amount: number }) {
      if (!import.meta.dev) {
        return;
      }

      try {
        await $fetch('/api/wallet/dev-confirm-funding', {
          method: 'POST',
          body: payload,
        });
      } catch (error) {
        if (import.meta.dev) {
          console.warn('[wallet] devConfirmFunding failed', error);
        }
      }
    },
  };
}
