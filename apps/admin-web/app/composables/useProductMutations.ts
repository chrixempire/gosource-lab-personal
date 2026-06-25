import { toast } from '@gosource/ui';
import { adminApiFetch } from '~/composables/useAdminApiFetch';
import { ADMIN_LIST_CACHE_URLS } from '~/lib/admin-list-cache-urls';
import { invalidateAdminListCache } from '~/lib/invalidate-admin-list-cache';
import {
  buildProductItemFormData,
  type ProductItemFormValues,
} from '~/lib/product-form';

export function useProductMutations() {
  const updatingProductId = ref<string | null>(null);

  function invalidateProductListCache() {
    invalidateAdminListCache(ADMIN_LIST_CACHE_URLS.products);
    invalidateAdminListCache(ADMIN_LIST_CACHE_URLS.activityLogs);
  }

  async function activateProduct(productId: string) {
    updatingProductId.value = productId;
    try {
      await adminApiFetch(`/api/products/${productId}/activate`, { method: 'PATCH' });
      invalidateProductListCache();
      toast.success('Product activated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to activate product';
      toast.error(message);
      throw error;
    } finally {
      updatingProductId.value = null;
    }
  }

  async function deactivateProduct(productId: string) {
    updatingProductId.value = productId;
    try {
      await adminApiFetch(`/api/products/${productId}/deactivate`, { method: 'PATCH' });
      invalidateProductListCache();
      toast.success('Product deactivated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to deactivate product';
      toast.error(message);
      throw error;
    } finally {
      updatingProductId.value = null;
    }
  }

  async function markProductInStock(productId: string) {
    updatingProductId.value = productId;
    try {
      await adminApiFetch(`/api/products/${productId}/in-stock`, { method: 'PATCH' });
      invalidateProductListCache();
      toast.success('Product marked in stock');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to mark product in stock';
      toast.error(message);
      throw error;
    } finally {
      updatingProductId.value = null;
    }
  }

  async function createProduct(form: ProductItemFormValues) {
    updatingProductId.value = 'create';
    try {
      const response = await adminApiFetch<unknown>('/api/products', {
        method: 'POST',
        body: buildProductItemFormData(form),
      });
      invalidateProductListCache();
      toast.success('Item created');
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create product';
      toast.error(message);
      throw error;
    } finally {
      updatingProductId.value = null;
    }
  }

  async function updateProduct(productId: string, form: ProductItemFormValues) {
    updatingProductId.value = productId;
    try {
      await adminApiFetch(`/api/products/${productId}`, {
        method: 'PATCH',
        body: buildProductItemFormData(form, { isEdit: true }),
      });
      invalidateProductListCache();
      toast.success('Product updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update product';
      toast.error(message);
      throw error;
    } finally {
      updatingProductId.value = null;
    }
  }

  async function markProductOutOfStock(productId: string) {
    updatingProductId.value = productId;
    try {
      await adminApiFetch(`/api/products/${productId}/out-stock`, { method: 'PATCH' });
      invalidateProductListCache();
      toast.success('Product marked out of stock');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to mark product out of stock';
      toast.error(message);
      throw error;
    } finally {
      updatingProductId.value = null;
    }
  }

  async function addProductStock(
    productId: string,
    body: { unitPrice: number; unit: string; quantity: number },
  ) {
    updatingProductId.value = productId;
    try {
      await adminApiFetch(`/api/products/${productId}/add-stock`, {
        method: 'PATCH',
        body,
      });
      invalidateProductListCache();
      toast.success('Stock added successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add stock';
      toast.error(message);
      throw error;
    } finally {
      updatingProductId.value = null;
    }
  }

  async function removeProductStock(
    productId: string,
    body: { unit: string; quantity: number; deductReason: string },
  ) {
    updatingProductId.value = productId;
    try {
      await adminApiFetch(`/api/products/${productId}/deduct-stock`, {
        method: 'PATCH',
        body,
      });
      invalidateProductListCache();
      toast.success('Stock removed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove stock';
      toast.error(message);
      throw error;
    } finally {
      updatingProductId.value = null;
    }
  }

  return {
    updatingProductId,
    activateProduct,
    deactivateProduct,
    createProduct,
    updateProduct,
    markProductInStock,
    markProductOutOfStock,
    addProductStock,
    removeProductStock,
  };
}
