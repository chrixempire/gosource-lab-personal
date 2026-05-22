import type { ApiClient } from './client';
import type {
  CreateWalletPayload,
  FundWalletPayload,
  VerifyBvnPayload,
  VerifyBvnResponse,
  WalletResponse,
  WalletTransactionsResponse,
} from './types';

export function createWalletApi(api: ApiClient) {
  return {
    getWallet: () => api.get<WalletResponse>('/wallet'),
    verifyBvn: (payload: VerifyBvnPayload) =>
      api.post<VerifyBvnResponse>('/wallet/verify-bvn', payload),
    createWallet: (payload: CreateWalletPayload) =>
      api.post<WalletResponse>('/wallet', payload),
    fundWallet: (payload: FundWalletPayload) =>
      api.post<WalletResponse>('/wallet/fund', payload),
    listTransactions: (query?: { page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      params.set('page', String(query?.page ?? 1));
      params.set('limit', String(query?.limit ?? 10));
      return api.get<WalletTransactionsResponse>(`/wallet/transactions?${params.toString()}`);
    },
  };
}
