<script setup lang="ts">
import type { BranchRecord, CustomerMeResponse, ShoppingListRecord } from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import { ClipboardList, Plus } from 'lucide-vue-next';
import BranchPickerDropdown from '~/components/branches/BranchPickerDropdown.vue';
import { useAddToList } from '~/composables/useAddToList';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import {
  extractShoppingListArray,
  useShoppingListBranchCache,
} from '~/composables/useShoppingListBranchCache';
import { useCustomerBranchService } from '~/services/branch.service';
import { useCustomerShoppingListService } from '~/services/shopping-list.service';

const isMobile = useMediaQuery('(max-width: 600px)');

const {
  pickerOpen,
  pendingItem,
  submitting,
  listsRefreshNonce,
  cancelPicker,
  addPendingToList,
  bumpListsRefresh,
} = useAddToList();

const { activeBranchId, ensureBranchForAction, fetchBranchesInBackground } = useMarketBranchGate();
const { listListsForBranch, createList } = useCustomerShoppingListService();
const { getCachedLists, setCachedLists } = useShoppingListBranchCache();

const session = useState<CustomerMeResponse | null>('customer-session', () => null);

const { listBranches } = useCustomerBranchService();

const isEmployeeSession = computed(() => session.value?.user_type === 'employee');
const showBranchPicker = computed(
  () => isBusinessOwnerSession(session.value) && !isEmployeeSession.value,
);

const branches = ref<BranchRecord[]>([]);
const branchesLoading = ref(false);
const pickerBranchId = ref('');
const loading = ref(false);
const lists = ref<ShoppingListRecord[]>([]);
const selectedListId = ref('');
const showCreateForm = ref(false);
const newListName = ref('');
const creatingList = ref(false);

const selectedList = computed(() =>
  lists.value.find((list) => list.id === selectedListId.value) ?? null,
);

async function loadBranches() {
  if (!showBranchPicker.value) {
    return;
  }

  branchesLoading.value = true;
  try {
    const response = await listBranches({ page: 1, limit: 100 });
    branches.value = Array.isArray(response.data) ? response.data : [];
    if (!pickerBranchId.value) {
      pickerBranchId.value =
        branches.value.find((branch) => branch.isHeadquarter)?.id
        ?? branches.value[0]?.id
        ?? '';
    }
  } finally {
    branchesLoading.value = false;
  }
}

async function resolveBranchId() {
  if (showBranchPicker.value) {
    return pickerBranchId.value || null;
  }

  const assignedBranchId = () => {
    const data = session.value?.data;
    return data && 'branchId' in data ? data.branchId : null;
  };

  let branchId = activeBranchId.value ?? assignedBranchId();
  if (!branchId) {
    await fetchBranchesInBackground(true);
    branchId = activeBranchId.value ?? assignedBranchId();
  }
  if (!branchId) {
    await ensureBranchForAction();
    branchId = activeBranchId.value ?? assignedBranchId();
  }
  return branchId;
}

async function loadLists() {
  if (showBranchPicker.value && !pickerBranchId.value) {
    lists.value = [];
    selectedListId.value = '';
    return;
  }

  const branchId = await resolveBranchId();

  if (!branchId) {
    lists.value = [];
    selectedListId.value = '';
    return;
  }

  const cached = getCachedLists(branchId);
  if (cached.length) {
    lists.value = cached;
    if (!lists.value.some((list) => list.id === selectedListId.value)) {
      selectedListId.value = lists.value[0]?.id ?? '';
    }
  }

  loading.value = true;
  try {
    const response = await listListsForBranch(branchId);
    lists.value = extractShoppingListArray(response);
    setCachedLists(branchId, lists.value);
    if (!lists.value.some((list) => list.id === selectedListId.value)) {
      selectedListId.value = lists.value[0]?.id ?? '';
    }
  } catch {
    if (!lists.value.length) {
      lists.value = [];
      selectedListId.value = '';
    }
  } finally {
    loading.value = false;
  }
}

watch(pickerOpen, (open) => {
  if (open) {
    showCreateForm.value = false;
    newListName.value = '';
    selectedListId.value = '';
    pickerBranchId.value = '';
    void loadBranches().then(() => loadLists());
    return;
  }

  showCreateForm.value = false;
  newListName.value = '';
  selectedListId.value = '';
  pickerBranchId.value = '';
});

watch(pickerBranchId, () => {
  if (pickerOpen.value && showBranchPicker.value) {
    selectedListId.value = '';
    void loadLists();
  }
});

watch(listsRefreshNonce, () => {
  if (pickerOpen.value) {
    void loadLists();
  }
});

function onPickerOpenChange(open: boolean) {
  if (!open) {
    cancelPicker();
  }
}

async function handleAddItem() {
  if (!selectedListId.value || !pendingItem.value) {
    return;
  }

  await addPendingToList(selectedListId.value, selectedList.value?.name);
}

async function handleCreateListAndAdd() {
  const name = newListName.value.trim();
  if (!name || creatingList.value) {
    return;
  }

  const branchId = await resolveBranchId();
  if (!branchId) {
    return;
  }

  creatingList.value = true;
  try {
    const response = await createList({ branchId, name });
    const created = response.data;
    if (!created?.id) {
      return;
    }

    bumpListsRefresh();
    lists.value = [created, ...lists.value];
    setCachedLists(branchId, lists.value);
    selectedListId.value = created.id;
    showCreateForm.value = false;
    newListName.value = '';
    await handleAddItem();
  } finally {
    creatingList.value = false;
  }
}
</script>

<template>
  <Drawer v-if="isMobile" :open="pickerOpen" @update:open="onPickerOpenChange">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader class="text-left">
        <DrawerTitle>Add item to list</DrawerTitle>
      </DrawerHeader>

      <DrawerBody class="relative min-h-[12rem] space-y-4 overflow-y-auto">
        <BranchPickerDropdown
          v-if="showBranchPicker"
          v-model="pickerBranchId"
          :branches="branches"
          :loading="branchesLoading"
          :disabled="submitting || creatingList"
        />

        <div
          v-if="showCreateForm"
          class="space-y-3 rounded-[16px] border border-grey-50 p-3"
        >
          <p class="text-sm font-medium text-grey-900">New list name</p>
          <Input v-model="newListName" placeholder="e.g. Weekly restock" :disabled="creatingList || submitting" />
        </div>

        <template v-else>
          <div v-if="pendingItem" class="space-y-0.5">
            <p class="text-sm font-medium text-grey-900">
              {{ pendingItem.productName }}
            </p>
            <p class="text-xs text-grey-300">
              {{ pendingItem.quantity }} × {{ pendingItem.unit }}
            </p>
          </div>

          <div v-if="loading && !lists.length" class="space-y-2">
            <div
              v-for="index in 3"
              :key="index"
              class="h-14 animate-pulse rounded-[12px] bg-grey-55"
            />
          </div>

          <RadioGroup
            v-else-if="lists.length"
            v-model="selectedListId"
            name="add-to-list-picker"
            class="flex flex-col gap-2"
            :disabled="submitting"
          >
            <label
              v-for="list in lists"
              :key="list.id"
              :class="[
                'flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border px-4 py-3 transition-colors',
                selectedListId === list.id
                  ? 'border-primary-500 bg-primary-50/60'
                  : 'border-grey-50 bg-background-on-canvas hover:border-primary-300 hover:bg-primary-50/30',
                submitting ? 'pointer-events-none opacity-60' : '',
              ]"
            >
              <span class="flex min-w-0 items-center gap-2.5">
                <RadioGroupItem :value="list.id" />
                <ClipboardList class="size-4 shrink-0 text-primary-500" />
                <span class="truncate font-medium text-grey-900">{{ list.name }}</span>
              </span>
              <span class="shrink-0 text-xs text-grey-300">
                {{ list.itemCount }} item{{ list.itemCount === 1 ? '' : 's' }}
              </span>
            </label>
          </RadioGroup>

          <div
            v-else
            class="flex flex-col items-center justify-center px-4 py-10 text-center"
          >
            <div class="mb-3 flex size-14 items-center justify-center rounded-full bg-grey-55">
              <ClipboardList class="size-7 text-grey-100" />
            </div>
            <p class="text-base font-medium text-grey-900">No lists yet</p>
            <p class="mt-1 max-w-xs text-sm text-grey-300">
              Create a list for this branch to save products you order often.
            </p>
          </div>
        </template>
      </DrawerBody>

      <DrawerFooter class="gap-3 border-t border-grey-50">
        <template v-if="showCreateForm">
          <Button variant="neutral" size="medium" :disabled="creatingList" @click="showCreateForm = false">
            Back
          </Button>
          <Button
            variant="primary"
            size="medium"
            :disabled="!newListName.trim() || creatingList"
            :loading="creatingList || submitting"
            @click="handleCreateListAndAdd"
          >
            Create and add
          </Button>
        </template>
        <template v-else>
          <Button
            variant="neutral"
            size="medium"
            :left-icon="Plus"
            :disabled="submitting || (showBranchPicker && !pickerBranchId)"
            @click="showCreateForm = true"
          >
            Add list
          </Button>
          <Button
            variant="primary"
            size="medium"
            :disabled="!selectedListId || !pendingItem || submitting || (showBranchPicker && !pickerBranchId)"
            :loading="submitting"
            @click="handleAddItem"
          >
            Add item
          </Button>
        </template>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="pickerOpen" @update:open="onPickerOpenChange">
    <DialogContent class="max-h-[min(88dvh,40rem)] max-w-md overflow-hidden p-0">
      <DialogHeader class="shrink-0 border-b border-grey-50 px-5 py-4">
        <DialogTitle class="min-w-0 flex-1 pr-2 text-left text-xl font-semibold text-grey-900">
          Add item to list
        </DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="relative max-h-[min(52dvh,28rem)] min-h-[12rem] space-y-4 overflow-y-auto px-5 py-4">
        <BranchPickerDropdown
          v-if="showBranchPicker"
          v-model="pickerBranchId"
          :branches="branches"
          :loading="branchesLoading"
          :disabled="submitting || creatingList"
        />

        <div v-if="showCreateForm" class="space-y-3 rounded-[16px] border border-grey-50 p-3">
          <p class="text-sm font-medium text-grey-900">New list name</p>
          <Input v-model="newListName" placeholder="e.g. Weekly restock" :disabled="creatingList || submitting" />
        </div>

        <template v-else>
          <div v-if="pendingItem" class="space-y-0.5">
            <p class="text-sm font-medium text-grey-900">
              {{ pendingItem.productName }}
            </p>
            <p class="text-xs text-grey-300">
              {{ pendingItem.quantity }} × {{ pendingItem.unit }}
            </p>
          </div>

          <div v-if="loading && !lists.length" class="space-y-2">
            <div
              v-for="index in 3"
              :key="index"
              class="h-14 animate-pulse rounded-[12px] bg-grey-55"
            />
          </div>

          <RadioGroup
            v-else-if="lists.length"
            v-model="selectedListId"
            name="add-to-list-picker-dialog"
            class="flex flex-col gap-2"
            :disabled="submitting"
          >
            <label
              v-for="list in lists"
              :key="list.id"
              :class="[
                'flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border px-4 py-3 transition-colors',
                selectedListId === list.id
                  ? 'border-primary-500 bg-primary-50/60'
                  : 'border-grey-50 bg-background-on-canvas hover:border-primary-300 hover:bg-primary-50/30',
                submitting ? 'pointer-events-none opacity-60' : '',
              ]"
            >
              <span class="flex min-w-0 items-center gap-2.5">
                <RadioGroupItem :value="list.id" />
                <ClipboardList class="size-4 shrink-0 text-primary-500" />
                <span class="truncate font-medium text-grey-900">{{ list.name }}</span>
              </span>
              <span class="shrink-0 text-xs text-grey-300">
                {{ list.itemCount }} item{{ list.itemCount === 1 ? '' : 's' }}
              </span>
            </label>
          </RadioGroup>

          <div
            v-else
            class="flex flex-col items-center justify-center px-4 py-10 text-center"
          >
            <div class="mb-3 flex size-14 items-center justify-center rounded-full bg-grey-55">
              <ClipboardList class="size-7 text-grey-100" />
            </div>
            <p class="text-base font-medium text-grey-900">No lists yet</p>
            <p class="mt-1 max-w-xs text-sm text-grey-300">
              Create a list for this branch to save products you order often.
            </p>
          </div>
        </template>
      </DialogBody>

      <DialogFooter class="gap-3 border-t border-grey-50 px-5 py-4">
        <template v-if="showCreateForm">
          <Button variant="neutral" size="medium" :disabled="creatingList" @click="showCreateForm = false">
            Back
          </Button>
          <Button
            variant="primary"
            size="medium"
            :disabled="!newListName.trim() || creatingList"
            :loading="creatingList || submitting"
            @click="handleCreateListAndAdd"
          >
            Create and add
          </Button>
        </template>
        <template v-else>
          <Button
            variant="neutral"
            size="medium"
            :left-icon="Plus"
            :disabled="submitting || (showBranchPicker && !pickerBranchId)"
            @click="showCreateForm = true"
          >
            Add list
          </Button>
          <Button
            variant="primary"
            size="medium"
            :disabled="!selectedListId || !pendingItem || submitting || (showBranchPicker && !pickerBranchId)"
            :loading="submitting"
            @click="handleAddItem"
          >
            Add item
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
