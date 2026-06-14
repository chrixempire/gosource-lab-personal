<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Pencil } from 'lucide-vue-next';
import InventoryCategoryOverlay from '~/components/inventory/InventoryCategoryOverlay.vue';
import { parseCategoryDetail } from '~/lib/category-api';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  categoryId: string | null;
}>();

const emit = defineEmits<{
  edit: [];
  delete: [];
}>();

const loadPending = ref(false);
const loadFailure = ref<unknown>(null);
const details = ref<ReturnType<typeof parseCategoryDetail>>(null);

async function loadCategoryDetails() {
  const categoryId = props.categoryId;
  if (!categoryId) {
    details.value = null;
    loadFailure.value = { statusCode: 404 };
    return;
  }

  loadPending.value = true;
  loadFailure.value = null;

  try {
    const payload = await $fetch<unknown>(`/api/categories/${categoryId}`);
    details.value = parseCategoryDetail(payload);
    if (!details.value) {
      loadFailure.value = { statusCode: 404 };
    }
  } catch (error) {
    loadFailure.value = error;
    details.value = null;
  } finally {
    loadPending.value = false;
  }
}

watch(
  () => [open.value, props.categoryId] as const,
  async ([isOpen]) => {
    if (!isOpen) {
      details.value = null;
      loadFailure.value = null;
      return;
    }

    await loadCategoryDetails();
  },
);
</script>

<template>
  <InventoryCategoryOverlay v-model:open="open" title="View category">
    <LoadErrorState
      v-if="loadFailure"
      compact
      :error="loadFailure"
      not-found-title="Category not found"
      resource-label="category"
      @retry="loadCategoryDetails"
    />
    <p v-else-if="loadPending" class="py-8 text-center text-sm text-grey-500">
      Loading category…
    </p>
    <div
      v-else-if="details"
      class="flex flex-col items-start gap-4 text-left"
    >
      <div
        v-if="details.imageUrl"
        class="size-28 overflow-hidden rounded-xl border border-grey-50 bg-grey-55"
      >
        <img :src="details.imageUrl" :alt="details.name" class="size-full object-cover">
      </div>
      <div
        v-else
        class="flex size-28 items-center justify-center rounded-xl border border-grey-50 bg-grey-55 text-2xl font-semibold text-grey-300"
      >
        {{ details.name.charAt(0) }}
      </div>

      <h3 class="text-lg font-semibold text-grey-900">
        {{ details.name }}
      </h3>

      <p class="text-sm leading-6 text-grey-600">
        {{ details.description || 'No description' }}
      </p>
    </div>

    <template v-if="details && !loadPending" #footer>
      <Button type="button" variant="destructive" size="medium" @click="emit('delete')">
        Delete
      </Button>
      <Button type="button" size="medium" :left-icon="Pencil" @click="emit('edit')">
        Edit
      </Button>
    </template>
  </InventoryCategoryOverlay>
</template>
