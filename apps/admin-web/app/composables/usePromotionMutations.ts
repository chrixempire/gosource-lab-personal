import { toast } from '@gosource/ui';
import { ADMIN_LIST_CACHE_URLS } from '~/lib/admin-list-cache-urls';
import { invalidateAdminListCache } from '~/lib/invalidate-admin-list-cache';
import { buildPromotionPayload } from '~/lib/promotion-form';
import type { PromotionFormValues } from '~/types/promotions';

export function usePromotionMutations() {
  const busyPromotionId = ref<string | null>(null);

  function invalidatePromotionsListCache() {
    invalidateAdminListCache(ADMIN_LIST_CACHE_URLS.promotions);
  }

  async function createPromotion(values: PromotionFormValues) {
    busyPromotionId.value = 'create';
    try {
      const body = buildPromotionPayload(values);
      const response = await $fetch<unknown>('/api/promotions', { method: 'POST', body });
      invalidatePromotionsListCache();
      toast.success('Promotion created');
      return response;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create promotion');
      throw error;
    } finally {
      busyPromotionId.value = null;
    }
  }

  async function updatePromotion(id: string, values: PromotionFormValues) {
    busyPromotionId.value = id;
    try {
      const body = buildPromotionPayload(values);
      const response = await $fetch<unknown>(`/api/promotions/${id}`, { method: 'PATCH', body });
      invalidatePromotionsListCache();
      toast.success('Promotion updated');
      return response;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update promotion');
      throw error;
    } finally {
      busyPromotionId.value = null;
    }
  }

  async function activatePromotion(id: string) {
    busyPromotionId.value = id;
    try {
      await $fetch(`/api/promotions/${id}/activate`, { method: 'PATCH', body: {} });
      invalidatePromotionsListCache();
      toast.success('Promotion reactivated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reactivate promotion');
      throw error;
    } finally {
      busyPromotionId.value = null;
    }
  }

  async function deactivatePromotion(id: string) {
    busyPromotionId.value = id;
    try {
      await $fetch(`/api/promotions/${id}/deactivate`, { method: 'PATCH', body: {} });
      invalidatePromotionsListCache();
      toast.success('Promotion deactivated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to deactivate promotion');
      throw error;
    } finally {
      busyPromotionId.value = null;
    }
  }

  async function duplicatePromotion(id: string) {
    busyPromotionId.value = id;
    try {
      await $fetch(`/api/promotions/${id}/duplicate`, { method: 'POST', body: {} });
      invalidatePromotionsListCache();
      toast.success('Promotion duplicated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to duplicate promotion');
      throw error;
    } finally {
      busyPromotionId.value = null;
    }
  }

  async function deletePromotion(id: string) {
    busyPromotionId.value = id;
    try {
      await $fetch(`/api/promotions/${id}`, { method: 'DELETE', body: {} });
      invalidatePromotionsListCache();
      toast.success('Promotion deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete promotion');
      throw error;
    } finally {
      busyPromotionId.value = null;
    }
  }

  return {
    busyPromotionId,
    createPromotion,
    updatePromotion,
    activatePromotion,
    deactivatePromotion,
    duplicatePromotion,
    deletePromotion,
  };
}
