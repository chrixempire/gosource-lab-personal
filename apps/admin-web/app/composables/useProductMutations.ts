import { toast } from '@gosource/ui';
import { extractApiErrorMessage } from '@gosource/api-client';
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
  }

  async function activateProduct(productId: string) {
    updatingProductId.value = productId;
    try {
      await adminApiFetch(`/api/products/${productId}/activate`, { method: 'PATCH' });
      invalidateProductListCache();
      toast.success('Product activated');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to activate product'));
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
      toast.error(extractApiErrorMessage(error, 'Unable to deactivate product'));
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
      toast.error(extractApiErrorMessage(error, 'Unable to mark product in stock'));
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
      toast.error(extractApiErrorMessage(error, 'Unable to create product'));
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
      toast.error(extractApiErrorMessage(error, 'Unable to update product'));
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
      toast.error(extractApiErrorMessage(error, 'Unable to mark product out of stock'));
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
      toast.error(extractApiErrorMessage(error, 'Unable to add stock'));
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
      toast.error(extractApiErrorMessage(error, 'Unable to remove stock'));
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
