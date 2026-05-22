<script setup lang="ts">
import { Button } from '@gosource/ui';
import CategoryForm from '~/components/inventory/CategoryForm.vue';
import InventoryCategoryOverlay from '~/components/inventory/InventoryCategoryOverlay.vue';
import { useCategoryMutations } from '~/composables/useCategoryMutations';
import { unwrapInventoryData } from '~/lib/inventory-api';
import {
  createEmptyCategoryFormValues,
  mapLegacyCategoryToFormValues,
  validateCategoryForm,
} from '~/lib/category-form';
import type { LegacyCategoryRow } from '~/types/inventory';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  mode: 'create' | 'edit';
  categoryId?: string | null;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const { updatingCategoryId, createCategory, updateCategory } = useCategoryMutations();

const form = reactive(createEmptyCategoryFormValues());
const fieldErrors = reactive<Record<string, string>>({});
const existingImageUrl = ref<string | null>(null);
const hydrated = ref(false);
const loadPending = ref(false);
const loadError = ref<string | null>(null);

const isEdit = computed(() => props.mode === 'edit');

const dialogTitle = computed(() => (isEdit.value ? 'Edit category' : 'Create category'));

const submitLabel = computed(() => (isEdit.value ? 'Save changes' : 'Create category'));

const submitting = computed(() => {
  if (isEdit.value) {
    return updatingCategoryId.value === props.categoryId;
  }
  return updatingCategoryId.value === 'create';
});

function resetFormState() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  Object.assign(form, createEmptyCategoryFormValues());
  existingImageUrl.value = null;
  hydrated.value = false;
  loadError.value = null;
}

async function loadCategoryForEdit() {
  if (!props.categoryId) {
    loadError.value = 'Category not found';
    return;
  }

  loadPending.value = true;
  loadError.value = null;
  hydrated.value = false;

  try {
    const payload = await $fetch<unknown>(`/api/categories/${props.categoryId}`);
    const body = unwrapInventoryData(payload);

    if (!body || typeof body !== 'object' || !('_id' in body)) {
      loadError.value = 'Category not found';
      return;
    }

    const category = body as LegacyCategoryRow;
    Object.assign(form, mapLegacyCategoryToFormValues(category));
    existingImageUrl.value = category.image ?? null;
    hydrated.value = true;
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load category';
  } finally {
    loadPending.value = false;
  }
}

watch(
  () => [open.value, props.mode, props.categoryId] as const,
  async ([isOpen]) => {
    if (!isOpen) {
      resetFormState();
      return;
    }

    resetFormState();

    if (props.mode === 'create') {
      hydrated.value = true;
      return;
    }

    await loadCategoryForEdit();
  },
);

async function onSubmit() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  Object.assign(
    fieldErrors,
    validateCategoryForm(form, {
      isEdit: isEdit.value,
      hasExistingImage: Boolean(existingImageUrl.value) || Boolean(form.imageFile),
    }),
  );

  if (Object.keys(fieldErrors).length > 0) {
    return;
  }

  try {
    if (isEdit.value && props.categoryId) {
      await updateCategory(props.categoryId, form);
    } else {
      await createCategory(form);
    }

    open.value = false;
    emit('saved');
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <InventoryCategoryOverlay v-model:open="open" :title="dialogTitle">
    <p v-if="loadError" class="text-sm text-negative-500">{{ loadError }}</p>
    <p v-else-if="loadPending" class="py-6 text-center text-sm text-grey-500">
      Loading category…
    </p>
        <CategoryForm
          v-else-if="hydrated"
          variant="plain"
          :form="form"
          :field-errors="fieldErrors"
          :submitting="submitting"
          :existing-image-url="existingImageUrl"
          :is-edit="isEdit"
          @update:existing-image-url="existingImageUrl = $event"
        />

    <template #footer>
      <Button
        type="button"
        variant="outline"
        size="small"
        :disabled="submitting"
        @click="open = false"
      >
        Cancel
      </Button>
      <Button
        type="button"
        size="small"
        :loading="submitting"
        :disabled="loadPending || Boolean(loadError) || !hydrated"
        @click="onSubmit"
      >
        {{ submitLabel }}
      </Button>
    </template>
  </InventoryCategoryOverlay>
</template>
