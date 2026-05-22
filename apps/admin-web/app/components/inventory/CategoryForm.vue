<script setup lang="ts">
import { Input } from '@gosource/ui';
import ProductImageDropzone from '~/components/inventory/ProductImageDropzone.vue';
import {
  clearResolvedCategoryFieldErrors,
  type CategoryFormValues,
} from '~/lib/category-form';
import type { ProductImageFormItem } from '~/lib/product-form';

const props = withDefaults(
  defineProps<{
    form: CategoryFormValues;
    fieldErrors: Record<string, string>;
    submitting?: boolean;
    existingImageUrl?: string | null;
    isEdit?: boolean;
    variant?: 'default' | 'plain';
  }>(),
  {
    variant: 'default',
    isEdit: false,
  },
);

const emit = defineEmits<{
  'update:existingImageUrl': [value: string | null];
}>();

const images = ref<ProductImageFormItem[]>([]);

const validationOptions = computed(() => ({
  isEdit: props.isEdit,
  hasExistingImage: Boolean(props.existingImageUrl) || images.value.some((image) => !image.file),
}));

watch(
  () => props.form,
  () => {
    if (Object.keys(props.fieldErrors).length === 0) {
      return;
    }

    clearResolvedCategoryFieldErrors(props.form, props.fieldErrors, validationOptions.value);
  },
  { deep: true },
);

function revokeBlobUrl(url: string | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function syncImagesFromSource() {
  if (props.form.imageFile) {
    const current = images.value[0];
    if (current?.file === props.form.imageFile) {
      return;
    }

    revokeBlobUrl(images.value[0]?.src);
    images.value = [
      {
        src: URL.createObjectURL(props.form.imageFile),
        file: props.form.imageFile,
        uploadProgress: null,
      },
    ];
    return;
  }

  if (props.existingImageUrl) {
    images.value = [{ src: props.existingImageUrl, file: null, uploadProgress: null }];
    return;
  }

  revokeBlobUrl(images.value[0]?.src);
  images.value = [];
}

watch(
  () => [props.existingImageUrl, props.form.imageFile] as const,
  () => syncImagesFromSource(),
  { immediate: true },
);

onBeforeUnmount(() => {
  revokeBlobUrl(images.value[0]?.src);
});

function onAddImages(files: File[]) {
  const file = files[0];
  if (!file) {
    return;
  }

  revokeBlobUrl(images.value[0]?.src);
  props.form.imageFile = file;
  emit('update:existingImageUrl', null);
  images.value = [
    {
      src: URL.createObjectURL(file),
      file,
      uploadProgress: null,
    },
  ];
}

function onRemoveImage() {
  revokeBlobUrl(images.value[0]?.src);
  props.form.imageFile = null;
  if (props.existingImageUrl) {
    emit('update:existingImageUrl', null);
  }
  images.value = [];
}

function onReplaceImage(_index: number, file: File) {
  onAddImages([file]);
}
</script>

<template>
  <component
    :is="variant === 'plain' ? 'div' : 'section'"
    :class="
      variant === 'plain'
        ? 'grid grid-cols-1 gap-5'
        : 'rounded-[20px] border border-grey-50 bg-white p-5 md:p-6'
    "
  >
    <h2 v-if="variant === 'default'" class="text-base font-semibold text-grey-900">
      Category details
    </h2>
    <div
      class="grid grid-cols-1 gap-5"
      :class="variant === 'default' ? 'mt-5' : undefined"
    >
      <div>
        <label class="mb-1.5 block text-sm font-medium text-grey-800">
          Image
          <span v-if="!isEdit" class="text-negative-500">*</span>
        </label>
        <ProductImageDropzone
          :images="images"
          :disabled="submitting"
          :invalid="Boolean(fieldErrors.image)"
          :max-images="1"
          hint="Drag or click to upload a category image"
          required-message="Please upload an image"
          @add="onAddImages"
          @remove="onRemoveImage"
          @replace="onReplaceImage"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-grey-800">Name</label>
        <Input
          v-model="form.name"
          :disabled="submitting"
          :invalid="Boolean(fieldErrors.name)"
          placeholder="Category name"
        />
        <p v-if="fieldErrors.name" class="mt-1 text-xs text-negative-500">{{ fieldErrors.name }}</p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-grey-800">Description (optional)</label>
        <textarea
          v-model="form.description"
          :disabled="submitting"
          rows="4"
          class="w-full rounded-xl border border-grey-50 bg-white px-3 py-2.5 text-sm text-grey-900 outline-none transition focus:border-primary-300 disabled:opacity-50"
          placeholder="Short description for this category"
        />
      </div>
    </div>
  </component>
</template>
