<script setup lang="ts">
import type { ShoppingListRecord } from '@gosource/api-client';
import { Button, ViewToggle, toast } from '@gosource/ui';
import { useDebounceFn } from '@vueuse/core';
import { Plus } from 'lucide-vue-next';
import CreateListDialog from '~/components/lists/CreateListDialog.vue';
import DeleteListDialog from '~/components/lists/DeleteListDialog.vue';
import ListDrawer from '~/components/lists/ListDrawer.vue';
import ListCards from '~/components/lists/ListCards.vue';
import ListTable from '~/components/lists/ListTable.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import MoveItemsDialog from '~/components/lists/MoveItemsDialog.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import { useAddToList } from '~/composables/useAddToList';
import { useShoppingListBranchCache } from '~/composables/useShoppingListBranchCache';
import { useListRequestAction } from '~/composables/useListRequestAction';
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch';

const runWhenSessionReady = useAuthenticatedFetch();
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { mapShoppingListToListItem } from '~/lib/shopping-list';
import { useCustomerBranchService } from '~/services/branch.service';
import { useCustomerShoppingListService } from '~/services/shopping-list.service';

const {
  listListsForBranch,
  getList,
  createList,
  updateList,
  deleteList,
  updateItem,
  deleteItem,
  clearItems,
  moveItems,
} = useCustomerShoppingListService();
const { listBranches } = useCustomerBranchService();

const route = useRoute();
const session = useState<{
  user_type?: 'customer' | 'employee';
  data?: { branchId?: string | null };
} | null>('customer-session', () => null);
const { listsRefreshNonce } = useAddToList();
const { setCachedLists } = useShoppingListBranchCache();
const { isSubmitting: requestSubmitting, submitListAsRequest } = useListRequestAction();
const { getQtyForUnit, setQuantityForUnit } = useMarketplaceCart();
const {
  effectiveView,
  routeView,
  isCompactViewport,
  setView,
} = useCollectionRouteState('table');

const loading = ref(true);
const lists = ref<ShoppingListRecord[]>([]);
const activeBranchId = ref('');
const searchValue = ref('');
const debouncedSearch = ref('');

const createDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const moveDialogOpen = ref(false);
const drawerOpen = ref(false);

const editingList = ref<ShoppingListRecord | null>(null);
const selectedList = ref<ShoppingListRecord | null>(null);
const listPendingDelete = ref<ShoppingListRecord | null>(null);
const itemIdsToMove = ref<string[]>([]);

const formSubmitting = ref(false);
const drawerItemsLoading = ref(false);
const savingItemId = ref<string | null>(null);
const moveSubmitting = ref(false);
const clearSubmitting = ref(false);

const syncSearch = useDebounceFn((value: string) => {
  debouncedSearch.value = value;
}, 200);

watch(searchValue, (value) => {
  syncSearch(value);
});

const filteredLists = computed(() => {
  const query = debouncedSearch.value.trim().toLowerCase();
  const items = lists.value.map(mapShoppingListToListItem);

  if (!query) {
    return items;
  }

  return items.filter((list) => list.name.toLowerCase().includes(query));
});

function findListRecord(listId: string) {
  return lists.value.find((list) => list.id === listId) ?? null;
}

useHead({
  title: 'Lists',
});

const isEmployeeSession = computed(() => session.value?.user_type === 'employee');
const employeeBranchId = computed(() => {
  const branchId = session.value?.data?.branchId;
  return typeof branchId === 'string' ? branchId.trim() : '';
});

async function fetchLists() {
  await refreshListsPayload();
}

const { data: listsPayload, pending: listsPending, refresh: refreshListsPayload } =
  await useAuthenticatedAsyncData(
    'shopping-lists-index',
    async () => {
      let resolvedBranchId = employeeBranchId.value;

      if (!resolvedBranchId) {
        const branchResponse = await runWhenSessionReady(() => listBranches({ page: 1, limit: 100 }));
        const branchRows = Array.isArray(branchResponse.data) ? branchResponse.data : [];
        resolvedBranchId =
          branchRows.find((branch) => branch.isHeadquarter)?.id
          ?? branchRows[0]?.id
          ?? '';
      }

      if (!resolvedBranchId) {
        return {
          branchId: '',
          lists: [] as ShoppingListRecord[],
        };
      }

      const response = await runWhenSessionReady(() => listListsForBranch(resolvedBranchId));
      return {
        branchId: resolvedBranchId,
        lists: Array.isArray(response.data) ? response.data : ([] as ShoppingListRecord[]),
      };
    },
    {
      default: () => ({
        branchId: '',
        lists: [] as ShoppingListRecord[],
      }),
    },
  );

watch(
  listsPayload,
  (payload) => {
    if (!payload) {
      return;
    }

    activeBranchId.value = payload.branchId ?? '';
    lists.value = Array.isArray(payload.lists) ? payload.lists : [];

    if (activeBranchId.value) {
      setCachedLists(activeBranchId.value, lists.value);
    }
  },
  { immediate: true },
);

watch(
  listsPending,
  (pending) => {
    loading.value = pending;
  },
  { immediate: true },
);

async function refreshSelectedList(listId?: string) {
  const targetId = listId ?? selectedList.value?.id;
  if (!targetId) {
    return;
  }

  drawerItemsLoading.value = true;
  try {
    const response = await getList(targetId);
    if (response.data) {
      selectedList.value = response.data;
      const index = lists.value.findIndex((list) => list.id === response.data?.id);
      if (index >= 0) {
        lists.value[index] = response.data;
      }
      const branchId = response.data.branchId || activeBranchId.value;
      if (branchId) {
        setCachedLists(branchId, lists.value);
      }
    }
  } finally {
    drawerItemsLoading.value = false;
  }
}

watch(listsRefreshNonce, () => {
  void fetchLists();
  if (selectedList.value?.id && drawerOpen.value) {
    void refreshSelectedList(selectedList.value.id);
  }
});

watch(
  () => route.query.list,
  async (listId) => {
    if (typeof listId !== 'string' || !listId) {
      return;
    }

    await fetchLists();
    await openListDrawer(listId);
  },
  { immediate: true },
);

function openCreateDialog() {
  editingList.value = null;
  createDialogOpen.value = true;
}

function openEditDialog(list: ShoppingListRecord) {
  editingList.value = list;
  createDialogOpen.value = true;
}

function openDeleteDialog(list: ShoppingListRecord) {
  listPendingDelete.value = list;
  deleteDialogOpen.value = true;
}

async function openListDrawer(listId: string) {
  selectedList.value = lists.value.find((list) => list.id === listId) ?? null;
  drawerOpen.value = true;
  await refreshSelectedList(listId);
}

async function handleCreateOrUpdateList(payload: { name: string; description: string }) {
  const branchId = activeBranchId.value;
  if (!branchId) {
    toast.error('Select a branch before managing lists.');
    return;
  }

  formSubmitting.value = true;
  try {
    if (editingList.value) {
      const listBranchId = editingList.value.branchId || branchId;
      await updateList(editingList.value.id, {
        branchId: listBranchId,
        name: payload.name,
        description: payload.description || undefined,
      });
      toast.success('List updated');
    } else {
      await createList({
        branchId,
        name: payload.name,
        description: payload.description || undefined,
      });
      toast.success('List created');
    }

    createDialogOpen.value = false;
    editingList.value = null;
    await fetchLists();
    if (selectedList.value && drawerOpen.value) {
      await refreshSelectedList(selectedList.value.id);
    }
  } finally {
    formSubmitting.value = false;
  }
}

async function handleDeleteList() {
  if (!listPendingDelete.value) {
    return;
  }

  formSubmitting.value = true;
  try {
    await deleteList(listPendingDelete.value.id);
    toast.success('List deleted');
    deleteDialogOpen.value = false;

    if (selectedList.value?.id === listPendingDelete.value.id) {
      drawerOpen.value = false;
      selectedList.value = null;
    }

    listPendingDelete.value = null;
    await fetchLists();
  } finally {
    formSubmitting.value = false;
  }
}

async function handleUpdateItem(payload: { itemId: string; quantity: number; unit: string }) {
  if (!selectedList.value) {
    return;
  }

  savingItemId.value = payload.itemId;
  try {
    await updateItem(selectedList.value.id, payload.itemId, {
      quantity: payload.quantity,
      unit: payload.unit,
    });
    await refreshSelectedList(selectedList.value.id);
  } finally {
    savingItemId.value = null;
  }
}

async function handleDeleteItem(itemId: string) {
  if (!selectedList.value) {
    return;
  }

  savingItemId.value = itemId;
  try {
    await deleteItem(selectedList.value.id, itemId);
    toast.success('Item removed');
    await refreshSelectedList(selectedList.value.id);
  } finally {
    savingItemId.value = null;
  }
}

async function handleClearItems() {
  if (!selectedList.value) {
    return;
  }

  clearSubmitting.value = true;
  try {
    await clearItems(selectedList.value.id);
    toast.success('List cleared');
    await refreshSelectedList(selectedList.value.id);
  } finally {
    clearSubmitting.value = false;
  }
}

function handleMoveSelected(itemIds: string[]) {
  itemIdsToMove.value = itemIds;
  moveDialogOpen.value = true;
}

async function handleMoveToCart(itemIds: string[]) {
  if (!selectedList.value) {
    return;
  }

  const items = selectedList.value.items.filter((item) => itemIds.includes(item.id));
  if (!items.length) {
    toast.error('No items to move.');
    return;
  }

  moveSubmitting.value = true;
  try {
    for (const item of items) {
      const current = getQtyForUnit(item.productId, item.unit);
      await setQuantityForUnit(item.productId, item.unit, current + item.quantity);
    }
    toast.success(
      items.length === 1 ? 'Item moved to cart' : `${items.length} items moved to cart`,
    );
  } finally {
    moveSubmitting.value = false;
  }
}

async function handleConfirmMove(targetListId: string) {
  if (!selectedList.value || !itemIdsToMove.value.length) {
    return;
  }

  moveSubmitting.value = true;
  try {
    await moveItems(selectedList.value.id, {
      targetListId,
      itemIds: itemIdsToMove.value,
    });
    toast.success('Items moved');
    moveDialogOpen.value = false;
    itemIdsToMove.value = [];
    await fetchLists();
    await refreshSelectedList(selectedList.value.id);
  } finally {
    moveSubmitting.value = false;
  }
}

async function handleCreateRequest() {
  if (!selectedList.value) {
    return;
  }

  await submitListAsRequest(selectedList.value);
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <p class="max-w-3xl text-base leading-7 text-grey-text">
      Add products from the market with <span class="font-medium text-grey-900">Add to list</span>, then click a row or choose <span class="font-medium text-grey-900">View list items</span> to see and edit items. Create a request when you are ready.
    </p>

    <div class="flex flex-col gap-4">
      <div
        class="flex w-full flex-col gap-3 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
      >
        <SearchField
          v-model="searchValue"
          class="w-full min-[900px]:max-w-md"
          placeholder="Search list name"
          :disabled="loading"
        />

        <div
          class="flex items-center gap-2"
          :class="loading ? 'pointer-events-none opacity-50' : undefined"
        >
          <ViewToggle
            v-if="!isCompactViewport"
            :model-value="routeView"
            @update:model-value="setView"
          />

          <Button
            variant="primary"
            size="medium"
            class="!w-auto shrink-0"
            :left-icon="Plus"
            @click="openCreateDialog"
          >
            Create list
          </Button>
        </div>
      </div>

      <ListTable
        v-if="effectiveView === 'table'"
        :lists="filteredLists"
        :loading="loading"
        @row-click="(list) => openListDrawer(list.id)"
        @view="(list) => openListDrawer(list.id)"
        @move="(list) => openListDrawer(list.id)"
        @edit="(list) => { const record = findListRecord(list.id); if (record) openEditDialog(record); }"
        @delete="(list) => { const record = findListRecord(list.id); if (record) openDeleteDialog(record); }"
      />

      <ListCards
        v-else
        :lists="filteredLists"
        :loading="loading"
        @row-click="(list) => openListDrawer(list.id)"
        @view="(list) => openListDrawer(list.id)"
        @move="(list) => openListDrawer(list.id)"
        @edit="(list) => { const record = findListRecord(list.id); if (record) openEditDialog(record); }"
        @delete="(list) => { const record = findListRecord(list.id); if (record) openDeleteDialog(record); }"
      />

      <div
        v-if="!loading && !filteredLists.length"
        class="rounded-[16px] border border-dashed border-grey-50 bg-white px-6 py-12 text-center"
      >
        <p class="text-base font-medium text-grey-900">No lists yet</p>
        <p class="mt-2 text-sm text-grey-300">
          Create a list to save products your branch orders often.
        </p>
      </div>
    </div>

    <CreateListDialog
      v-model:open="createDialogOpen"
      :list="editingList"
      :submitting="formSubmitting"
      @submit="handleCreateOrUpdateList"
    />

    <DeleteListDialog
      v-model:open="deleteDialogOpen"
      :list-name="listPendingDelete?.name ?? ''"
      :submitting="formSubmitting"
      @confirm="handleDeleteList"
    />

    <MoveItemsDialog
      v-model:open="moveDialogOpen"
      :lists="lists"
      :current-list-id="selectedList?.id ?? ''"
      :selected-count="itemIdsToMove.length"
      :submitting="moveSubmitting"
      @confirm="handleConfirmMove"
    />

    <ListDrawer
      v-model:open="drawerOpen"
      :list="selectedList"
      :items-loading="drawerItemsLoading"
      :saving-item-id="savingItemId"
      :move-submitting="moveSubmitting"
      :clear-submitting="clearSubmitting"
      @refresh="refreshSelectedList()"
      @update-item="handleUpdateItem"
      @delete-item="handleDeleteItem"
      @clear-items="handleClearItems"
      @move-to-cart="handleMoveToCart"
    />
  </div>
</template>
