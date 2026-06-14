import { toast } from '@gosource/ui';
import { ADMIN_LIST_CACHE_URLS } from '~/lib/admin-list-cache-urls';
import { buildDiscountPayload } from '~/lib/discount-form';
import { invalidateAdminListCache } from '~/lib/invalidate-admin-list-cache';
import type { DiscountFormValues, DiscountRouteSlug } from '~/types/discounts';

export function useDiscountMutations() {
  const busyDiscountId = ref<string | null>(null);

  function invalidateDiscountsListCache() {
    invalidateAdminListCache(ADMIN_LIST_CACHE_URLS.coupons);
  }

  async function createDiscount(
    slug: DiscountRouteSlug,
    values: DiscountFormValues,
    productIdsInCategory?: string[],
  ) {
    busyDiscountId.value = 'create';
    try {
      const body = buildDiscountPayload(values, slug, productIdsInCategory);
      const response = await $fetch<unknown>('/api/coupons', { method: 'POST', body });
      invalidateDiscountsListCache();
      toast.success('Discount created');
      return response;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create discount');
      throw error;
    } finally {
      busyDiscountId.value = null;
    }
  }

  async function updateDiscount(
    id: string,
    slug: DiscountRouteSlug,
    values: DiscountFormValues,
    productIdsInCategory?: string[],
  ) {
    busyDiscountId.value = id;
    try {
      const body = buildDiscountPayload(values, slug, productIdsInCategory);
      const response = await $fetch<unknown>(`/api/coupons/${id}`, { method: 'PATCH', body });
      invalidateDiscountsListCache();
      toast.success('Discount updated');
      return response;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update discount');
      throw error;
    } finally {
      busyDiscountId.value = null;
    }
  }

  async function activateDiscount(id: string) {
    busyDiscountId.value = id;
    try {
      await $fetch(`/api/coupons/${id}/activate`, { method: 'PATCH', body: {} });
      invalidateDiscountsListCache();
      toast.success('Discount activated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to activate discount');
      throw error;
    } finally {
      busyDiscountId.value = null;
    }
  }

  async function deactivateDiscount(id: string) {
    busyDiscountId.value = id;
    try {
      await $fetch(`/api/coupons/${id}/deactivate`, { method: 'PATCH', body: {} });
      invalidateDiscountsListCache();
      toast.success('Discount deactivated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to deactivate discount');
      throw error;
    } finally {
      busyDiscountId.value = null;
    }
  }

  async function deleteDiscount(id: string) {
    busyDiscountId.value = id;
    try {
      await $fetch(`/api/coupons/${id}`, { method: 'DELETE', body: {} });
      invalidateDiscountsListCache();
      toast.success('Discount deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete discount');
      throw error;
    } finally {
      busyDiscountId.value = null;
    }
  }

  return {
    busyDiscountId,
    createDiscount,
    updateDiscount,
    activateDiscount,
    deactivateDiscount,
    deleteDiscount,
  };
}
