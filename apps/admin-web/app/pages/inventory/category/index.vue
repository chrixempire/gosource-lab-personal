<script setup lang="ts">
import { Button, SearchField, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { ArrowUpDown, Plus } from 'lucide-vue-next';
import CategoryCardsGrid from '~/components/inventory/CategoryCardsGrid.vue';
import CategoryDeleteDialog from '~/components/inventory/CategoryDeleteDialog.vue';
import CategoryFormDialog from '~/components/inventory/CategoryFormDialog.vue';
import CategoryRearrangeConfirmDialog from '~/components/inventory/CategoryRearrangeConfirmDialog.vue';
import CategoryTable from '~/components/inventory/CategoryTable.vue';
import CategoryViewDialog from '~/components/inventory/CategoryViewDialog.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useCategoryMutations } from '~/composables/useCategoryMutations';
import { parseCategoriesResponse, parseCategoryOptions } from '~/lib/category-api';
import type { AdminCategoryListItem } from '~/types/inventory';

const { updateHeader } = useAdminHeader();
const {
  deletingCategoryId,
  rearranging,
  deleteCategory,
  rearrangeCategories,
} = useCategoryMutations();

const {
  routeView,
  effectiveView,
  isCompactViewport,
  setView,
} = useCollectionRouteState('table');

const page = ref(1);
const limit = ref(20);
const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 500);

const isRearrange = ref(false);
const rearrangeList = ref<AdminCategoryListItem[]>([]);
const rearrangeLoading = ref(false);

const deleteOpen = ref(false);
const rearrangeConfirmOpen = ref(false);
const formOpen = ref(false);
const viewOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const categoryToEditId = ref<string | null>(null);
const categoryToViewId = ref<string | null>(null);
const categoryToDelete = ref<AdminCategoryListItem | null>(null);
const selectedCategoryIds = ref<string[]>([]);

const apiQuery = computed(() => {
  const trimmed = debouncedSearch.value.trim();
  return {
    page: page.value,
    limit: limit.value,
    ...(trimmed
      ? {
          filterBy: 'name',
          filterValue: trimmed,
        }
      : {}),
  };
});

const { data, pending, error, refresh } = await useFetch<unknown>('/api/categories', {
  query: apiQuery,
  watch: [apiQuery],
});

const { data: categoriesPayload, refresh: refreshCategoryOptions } = await useFetch<unknown>(
  '/api/categories',
  {
    query: { page: 1, limit: 200 },
  },
);

const parsed = computed(() => parseCategoriesResponse(data.value, page.value, limit.value));
const categories = computed(() => parsed.value.rows);
const meta = computed(() => parsed.value.meta);
const categoryOptions = computed(() => parseCategoryOptions(categoriesPayload.value));

const displayCategories = computed(() =>
  isRearrange.value ? rearrangeList.value : categories.value,
);

const deleteLoading = computed(
  () =>
    Boolean(
      categoryToDelete.value && deletingCategoryId.value === categoryToDelete.value.id,
    ),
);

watch(debouncedSearch, () => {
  if (!isRearrange.value) {
    page.value = 1;
  }
});

function setPage(nextPage: number) {
  page.value = nextPage;
}

function setLimit(nextLimit: number) {
  limit.value = nextLimit;
  page.value = 1;
}

function onCreateCategory() {
  formMode.value = 'create';
  categoryToEditId.value = null;
  formOpen.value = true;
}

async function startRearrange() {
  rearrangeLoading.value = true;
  try {
    const payload = await $fetch<unknown>('/api/categories', {
      query: { page: 1, limit: 200 },
    });
    const parsedAll = parseCategoriesResponse(payload, 1, 200);
    rearrangeList.value = [...parsedAll.rows].sort((a, b) => b.position - a.position);
    isRearrange.value = true;
  } catch {
  } finally {
    rearrangeLoading.value = false;
  }
}

function cancelRearrange() {
  isRearrange.value = false;
  rearrangeList.value = [];
}

function onSaveRearrangeClick() {
  rearrangeConfirmOpen.value = true;
}

function onView(category: AdminCategoryListItem) {
  categoryToViewId.value = category.id;
  viewOpen.value = true;
}

function onEdit(category: AdminCategoryListItem) {
  formMode.value = 'edit';
  categoryToEditId.value = category.id;
  formOpen.value = true;
}

function onViewEdit() {
  viewOpen.value = false;
  if (categoryToViewId.value) {
    formMode.value = 'edit';
    categoryToEditId.value = categoryToViewId.value;
    formOpen.value = true;
  }
}

function onViewDelete() {
  const match = displayCategories.value.find((row) => row.id === categoryToViewId.value);
  if (match) {
    viewOpen.value = false;
    onDelete(match);
  }
}

async function onFormSaved() {
  await Promise.all([refresh(), refreshCategoryOptions()]);
}

function onDelete(category: AdminCategoryListItem) {
  categoryToDelete.value = category;
  deleteOpen.value = true;
}

async function onDeleteConfirm(payload: { deleteAll: boolean; newCategoryId?: string }) {
  if (!categoryToDelete.value) {
    return;
  }

  try {
    await deleteCategory(categoryToDelete.value.id, payload);
    deleteOpen.value = false;
    categoryToDelete.value = null;
    await Promise.all([refresh(), refreshCategoryOptions()]);
  } catch {
    // toast in composable
  }
}

async function onRearrangeConfirm() {
  if (rearranging.value || rearrangeList.value.length === 0) {
    return;
  }

  const count = rearrangeList.value.length;
  const items = rearrangeList.value.map((item, index) => ({
    id: item.id,
    position: count - 1 - index,
  }));

  try {
    await rearrangeCategories(items);
    rearrangeConfirmOpen.value = false;
    isRearrange.value = false;
    rearrangeList.value = [];
    await refresh();
  } catch {
    // toast in composable
  }
}

updateHeader({
  title: 'Categories',
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div
      class="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
    >
      <p class="max-w-xl text-sm text-grey-600">
        Product categories used to organise your catalogue.
      </p>

      <div class="flex flex-wrap items-center gap-2 self-start min-[900px]:self-auto">
        <template v-if="isRearrange">
          <Button
            type="button"
            variant="secondary"
            size="small"
            class="!w-fit shrink-0"
            @click="cancelRearrange"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="small"
            class="!w-fit shrink-0"
            :loading="rearranging"
            :disabled="rearrangeList.length === 0"
            @click="onSaveRearrangeClick"
          >
            Save arrangement
          </Button>
        </template>
        <template v-else>
          <Button
            type="button"
            variant="secondary"
            size="small"
            class="!w-fit shrink-0"
            :left-icon="ArrowUpDown"
            :loading="rearrangeLoading"
            @click="startRearrange"
          >
            Rearrange categories
          </Button>
          <Button
            type="button"
            size="small"
            class="!w-fit shrink-0"
            :left-icon="Plus"
            @click="onCreateCategory"
          >
            Create category
          </Button>
        </template>
      </div>
    </div>

    <div
      v-if="!isRearrange"
      class="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
    >
      <div class="w-full min-[900px]:max-w-md">
        <SearchField
          v-model="searchQuery"
          placeholder="Search categories"
          :disabled="pending && categories.length === 0"
        />
      </div>

      <div
        class="flex items-center gap-2 self-start min-[900px]:self-auto"
        :class="pending && categories.length === 0 ? 'pointer-events-none opacity-50' : undefined"
      >
        <ViewToggle
          v-if="!isCompactViewport"
          :model-value="routeView"
          @update:model-value="setView"
        />
      </div>
    </div>

    <p v-else class="text-sm text-grey-600">
      Drag categories to change their order, then save your arrangement.
    </p>

    <EmptyState
      v-if="effectiveView === 'cards' && error && displayCategories.length === 0 && !isRearrange"
      title="Unable to load categories"
      :description="error.message || 'Please try again.'"
    >
      <button
        type="button"
        class="text-sm font-medium text-primary-600 hover:text-primary-700"
        @click="refresh()"
      >
        Retry
      </button>
    </EmptyState>

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && !isRearrange && displayCategories.length === 0"
      title="No categories found"
      description="Try a different search term or create a new category."
    />

    <template v-else>
      <CategoryTable
        v-if="isRearrange || effectiveView === 'table'"
        v-model:selected-ids="selectedCategoryIds"
        :categories="displayCategories"
        :meta="meta"
        :loading="(pending || rearrangeLoading) && !isRearrange"
        :rearrange-mode="isRearrange"
        :busy-category-id="deletingCategoryId"
        @update:categories="rearrangeList = $event"
        @page="setPage"
        @page-size="setLimit"
        @view="onView"
        @edit="onEdit"
        @delete="onDelete"
      />
      <CategoryCardsGrid
        v-else
        :categories="categories"
        :meta="meta"
        :loading="pending"
        :busy-category-id="deletingCategoryId"
        @page="setPage"
        @page-size="setLimit"
        @view="onView"
        @edit="onEdit"
        @delete="onDelete"
      />
    </template>

    <CategoryDeleteDialog
      v-model:open="deleteOpen"
      :category="categoryToDelete"
      :category-options="categoryOptions"
      :loading="deleteLoading"
      @confirm="onDeleteConfirm"
    />

    <CategoryFormDialog
      v-model:open="formOpen"
      :mode="formMode"
      :category-id="categoryToEditId"
      @saved="onFormSaved"
    />

    <CategoryViewDialog
      v-model:open="viewOpen"
      :category-id="categoryToViewId"
      @edit="onViewEdit"
      @delete="onViewDelete"
    />

    <CategoryRearrangeConfirmDialog
      v-model:open="rearrangeConfirmOpen"
      :loading="rearranging"
      @confirm="onRearrangeConfirm"
    />
  </div>
</template>
