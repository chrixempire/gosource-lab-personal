import { toast } from '@gosource/ui';
import { ADMIN_LIST_CACHE_URLS } from '~/lib/admin-list-cache-urls';
import {
  buildCategoryFormData,
  buildCategoryRequestBody,
  type CategoryFormValues,
} from '~/lib/category-form';
import { invalidateAdminListCache } from '~/lib/invalidate-admin-list-cache';

export function useCategoryMutations() {
  const updatingCategoryId = ref<string | null>(null);
  const deletingCategoryId = ref<string | null>(null);
  const rearranging = ref(false);

  function invalidateCategoryListCache() {
    invalidateAdminListCache(ADMIN_LIST_CACHE_URLS.categories);
  }

  async function createCategory(values: CategoryFormValues) {
    updatingCategoryId.value = 'create';
    try {
      const response = await $fetch<unknown>('/api/categories', {
        method: 'POST',
        body: buildCategoryFormData(values),
      });
      invalidateCategoryListCache();
      toast.success('Category created');
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create category';
      toast.error(message);
      throw error;
    } finally {
      updatingCategoryId.value = null;
    }
  }

  async function updateCategory(categoryId: string, values: CategoryFormValues) {
    updatingCategoryId.value = categoryId;
    try {
      if (values.imageFile) {
        await $fetch(`/api/categories/${categoryId}`, {
          method: 'PATCH',
          body: buildCategoryFormData(values),
        });
      } else {
        await $fetch(`/api/categories/${categoryId}`, {
          method: 'PATCH',
          body: buildCategoryRequestBody(values),
        });
      }
      invalidateCategoryListCache();
      toast.success('Category updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update category';
      toast.error(message);
      throw error;
    } finally {
      updatingCategoryId.value = null;
    }
  }

  async function deleteCategory(
    categoryId: string,
    payload: { deleteAll: boolean; newCategoryId?: string },
  ) {
    deletingCategoryId.value = categoryId;
    try {
      await $fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        body: payload,
      });
      invalidateCategoryListCache();
      toast.success('Category deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete category';
      toast.error(message);
      throw error;
    } finally {
      deletingCategoryId.value = null;
    }
  }

  async function rearrangeCategories(
    items: Array<{ id: string; position: number }>,
  ) {
    rearranging.value = true;
    try {
      await $fetch('/api/categories/rearrange', {
        method: 'PATCH',
        body: { rearrangedCategories: items },
      });
      invalidateCategoryListCache();
      toast.success('Categories rearranged');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to rearrange categories';
      toast.error(message);
      throw error;
    } finally {
      rearranging.value = false;
    }
  }

  return {
    updatingCategoryId,
    deletingCategoryId,
    rearranging,
    createCategory,
    updateCategory,
    deleteCategory,
    rearrangeCategories,
  };
}
