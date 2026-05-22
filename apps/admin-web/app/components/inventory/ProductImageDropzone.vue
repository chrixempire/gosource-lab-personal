<script setup lang="ts">
import { Pencil, Plus, Trash2 } from 'lucide-vue-next';
import type { ProductImageFormItem } from '~/lib/product-form';

const SLOT_SIZE_CLASS = 'size-[7.5rem]';

const props = withDefaults(
  defineProps<{
    images: ProductImageFormItem[];
    disabled?: boolean;
    invalid?: boolean;
    /** Maximum number of images (default 4 for products, 1 for categories). */
    maxImages?: number;
    hint?: string;
    requiredMessage?: string;
  }>(),
  {
    maxImages: 4,
    requiredMessage: 'At least one image is required',
  },
);

const emit = defineEmits<{
  add: [files: File[]];
  remove: [index: number];
  replace: [index: number, file: File];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const replaceIndex = ref<number | null>(null);
const dragActive = ref(false);

const canAddMore = computed(() => props.images.length < props.maxImages);

const uploadHint = computed(
  () =>
    props.hint ??
    (props.maxImages === 1
      ? 'Drag or click to upload an image'
      : `Please drag or click to upload up to ${props.maxImages} images`),
);

function openPicker(forIndex: number | null = null) {
  replaceIndex.value = forIndex;
  inputRef.value?.click();
}

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';

  const file = files[0];
  if (!file) {
    return;
  }

  if (replaceIndex.value != null) {
    emit('replace', replaceIndex.value, file);
    replaceIndex.value = null;
    return;
  }

  const remaining = props.maxImages - props.images.length;
  if (remaining > 0) {
    emit('add', files.slice(0, remaining));
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  dragActive.value = false;

  if (props.disabled || !canAddMore.value) {
    return;
  }

  const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
    file.type.startsWith('image/'),
  );

  if (files.length === 0) {
    return;
  }

  const remaining = props.maxImages - props.images.length;
  emit('add', files.slice(0, remaining));
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  if (!props.disabled && canAddMore.value) {
    dragActive.value = true;
  }
}

function onDragLeave() {
  dragActive.value = false;
}

function isUploading(image: ProductImageFormItem) {
  return image.uploadProgress != null && image.uploadProgress < 100;
}
</script>

<template>
  <div>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      :multiple="maxImages > 1"
      class="hidden"
      :disabled="disabled"
      @change="onFilesSelected"
    >

    <div
      class="flex flex-wrap gap-4"
      :class="dragActive ? 'rounded-xl ring-2 ring-primary-200' : undefined"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div
        v-for="(image, index) in images"
        :key="`${image.id ?? image.src}-${index}`"
        class="w-[7.5rem] shrink-0"
      >
        <div
          class="relative overflow-hidden rounded-2xl border border-grey-50 bg-grey-55"
          :class="[
            SLOT_SIZE_CLASS,
            !isUploading(image) && !disabled ? 'cursor-pointer' : undefined,
          ]"
          :role="!isUploading(image) && !disabled ? 'button' : undefined"
          :tabindex="!isUploading(image) && !disabled ? 0 : undefined"
          @click="!isUploading(image) && !disabled && openPicker(index)"
          @keydown.enter.prevent="!isUploading(image) && !disabled && openPicker(index)"
        >
          <img
            v-if="!isUploading(image)"
            :src="image.src"
            alt=""
            class="size-full object-cover"
          >
          <div
            v-else
            class="flex size-full items-center justify-center bg-grey-55 text-xs text-grey-400"
          >
            Uploading…
          </div>

          <div
            v-if="!isUploading(image)"
            class="absolute right-1.5 top-1.5 flex items-center gap-1"
            @click.stop
          >
            <button
              type="button"
              class="flex size-7 cursor-pointer items-center justify-center rounded-full border border-grey-50 bg-white/95 text-grey-700 shadow-sm transition hover:border-grey-100 hover:text-grey-900"
              :disabled="disabled"
              aria-label="Edit image"
              @click="openPicker(index)"
            >
              <Pencil class="size-3.5" />
            </button>
            <button
              type="button"
              class="flex size-7 cursor-pointer items-center justify-center rounded-full border border-grey-50 bg-white/95 text-grey-700 shadow-sm transition hover:border-negative-100 hover:text-negative-500"
              :disabled="disabled"
              aria-label="Delete image"
              @click="emit('remove', index)"
            >
              <Trash2 class="size-3.5" />
            </button>
          </div>
        </div>

        <div
          v-if="isUploading(image)"
          class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-grey-100"
        >
          <div
            class="h-full rounded-full bg-primary-500 transition-[width] duration-75 ease-linear"
            :style="{ width: `${Math.max(image.uploadProgress ?? 0, 4)}%` }"
          />
        </div>
      </div>

      <button
        v-if="canAddMore"
        type="button"
        class="w-[7.5rem] shrink-0 cursor-pointer"
        :disabled="disabled"
        @click="openPicker(null)"
      >
        <div
          class="flex items-center justify-center rounded-2xl border border-grey-50 bg-grey-55 text-grey-400 transition hover:border-primary-200 hover:text-primary-500"
          :class="[
            SLOT_SIZE_CLASS,
            invalid && images.length === 0 ? 'border-negative-300' : undefined,
            dragActive ? 'border-primary-300 bg-primary-50/50' : undefined,
          ]"
        >
          <Plus class="size-6 stroke-[1.5]" />
        </div>
      </button>
    </div>

    <p v-if="uploadHint" class="mt-3 text-sm text-grey-500">
      {{ uploadHint }}
    </p>
    <p v-if="invalid && images.length === 0" class="mt-1 text-xs text-negative-500">
      {{ requiredMessage }}
    </p>
  </div>
</template>
