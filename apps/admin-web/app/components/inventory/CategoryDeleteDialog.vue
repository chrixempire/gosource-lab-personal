<script setup lang="ts">
import { Button, RadioGroup, RadioGroupItem } from '@gosource/ui';
import InventorySearchableSelect from '~/components/inventory/InventorySearchableSelect.vue';
import InventoryCategoryOverlay from '~/components/inventory/InventoryCategoryOverlay.vue';
import AdminWarningInfo from '~/components/shared/AdminWarningInfo.vue';
import type { AdminCategoryListItem, CategoryOption } from '~/types/inventory';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  category: AdminCategoryListItem | null;
  categoryOptions: CategoryOption[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [payload: { deleteAll: boolean; newCategoryId?: string }];
}>();

type DeleteMode = 'transfer' | 'deleteAll';

const deleteMode = ref<DeleteMode>('transfer');
const targetCategoryId = ref('');

const otherCategories = computed(() =>
  props.categoryOptions.filter((option) => option.id !== props.category?.id),
);

const searchableOptions = computed(() =>
  otherCategories.value.map((option) => ({ value: option.id, label: option.label })),
);

const hasProducts = computed(() => (props.category?.productCount ?? 0) > 0);

const associatedItemsLabel = computed(() => {
  const count = props.category?.productCount ?? 0;
  return count === 1 ? '1 item' : `${count} items`;
});

watch(open, (value) => {
  if (!value) {
    deleteMode.value = 'transfer';
    targetCategoryId.value = '';
    return;
  }

  if (!hasProducts.value) {
    deleteMode.value = 'deleteAll';
    return;
  }

  deleteMode.value = 'transfer';
  targetCategoryId.value = otherCategories.value[0]?.id ?? '';
});

watch(deleteMode, (mode) => {
  if (mode === 'transfer' && !targetCategoryId.value) {
    targetCategoryId.value = otherCategories.value[0]?.id ?? '';
  }
});

function onConfirm() {
  if (!props.category) {
    return;
  }

  if (!hasProducts.value || deleteMode.value === 'deleteAll') {
    emit('confirm', { deleteAll: true });
    return;
  }

  if (!targetCategoryId.value) {
    return;
  }

  emit('confirm', {
    deleteAll: false,
    newCategoryId: targetCategoryId.value,
  });
}
</script>

<template>
  <InventoryCategoryOverlay v-model:open="open" title="Delete category" dialog-class="w-[min(92vw,520px)]">
    <div class="space-y-4 text-left">
      <p class="text-sm text-grey-800">
        Are you sure you want to delete “{{ category?.name }}” category?
      </p>

      <template v-if="hasProducts">
        <AdminWarningInfo>
          There are {{ associatedItemsLabel }} associated with this category. What would you like
          to do?
        </AdminWarningInfo>

        <RadioGroup v-model="deleteMode" class="flex flex-col gap-3">
          <div class="space-y-3">
            <label class="flex cursor-pointer items-start gap-3">
              <RadioGroupItem value="transfer" class="mt-0.5" />
              <span class="text-sm text-grey-800">
                Delete category and move associated items to another category
              </span>
            </label>

            <div v-if="deleteMode === 'transfer'" class="pl-7">
              <label class="mb-1.5 block text-sm font-medium text-grey-800">Category</label>
              <InventorySearchableSelect
                v-model="targetCategoryId"
                :options="searchableOptions"
                placeholder="Select category"
                :disabled="otherCategories.length === 0"
              />
            </div>
          </div>

          <label class="flex cursor-pointer items-start gap-3">
            <RadioGroupItem value="deleteAll" class="mt-0.5" />
            <span class="text-sm text-grey-800">
              Delete category and its associated items completely
            </span>
          </label>
        </RadioGroup>
      </template>

      <p v-else class="text-sm text-grey-600">
        This category has no items and will be removed permanently.
      </p>
    </div>

    <template #footer>
      <Button type="button" variant="outline" size="medium" @click="open = false">
        Cancel
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="medium"
        :loading="loading"
        :disabled="hasProducts && deleteMode === 'transfer' && !targetCategoryId"
        @click="onConfirm"
      >
        Delete category
      </Button>
    </template>
  </InventoryCategoryOverlay>
</template>
