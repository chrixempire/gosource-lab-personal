import { toast } from '@gosource/ui';
import type { StoreCountSubmitPayload } from '~/types/store-count';

export function useStoreCountMutations() {
  const submitting = ref(false);

  async function completeStockCount(payload: StoreCountSubmitPayload) {
    submitting.value = true;
    try {
      const response = await $fetch<unknown>('/api/products/stock-counts', {
        method: 'POST',
        body: payload,
      });
      toast.success('Stock count completed');
      return response;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to complete stock count');
      throw error;
    } finally {
      submitting.value = false;
    }
  }

  return {
    submitting,
    completeStockCount,
  };
}
