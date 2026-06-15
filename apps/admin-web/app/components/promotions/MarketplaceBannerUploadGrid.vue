<script setup lang="ts">
import { Pencil, Plus, Trash2 } from 'lucide-vue-next';
import {
  MARKETPLACE_BANNER_SLOT_COUNT,
  type MarketplaceBannerDraftSlot,
} from '~/lib/marketplace-banners';

const props = defineProps<{
  slots: MarketplaceBannerDraftSlot[];
}>();

const emit = defineEmits<{
  add: [files: File[]];
  replace: [index: number, file: File];
  remove: [index: number];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const replaceIndex = ref<number | null>(null);
const dragActive = ref(false);

const canAddMore = computed(() => props.slots.length < MARKETPLACE_BANNER_SLOT_COUNT);

function openPicker(forIndex: number | null = null) {
  replaceIndex.value = forIndex;
  inputRef.value?.click();
}

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []).filter((file) => file.type.startsWith('image/'));
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

  const remaining = MARKETPLACE_BANNER_SLOT_COUNT - props.slots.length;
  if (remaining > 0) {
    emit('add', files.slice(0, remaining));
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  dragActive.value = false;

  if (!canAddMore.value) {
    return;
  }

  const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
    file.type.startsWith('image/'),
  );

  if (files.length === 0) {
    return;
  }

  const remaining = MARKETPLACE_BANNER_SLOT_COUNT - props.slots.length;
  emit('add', files.slice(0, remaining));
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  if (canAddMore.value) {
    dragActive.value = true;
  }
}

function onDragLeave() {
  dragActive.value = false;
}
</script>

<template>
  <div>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="onFilesSelected"
    >

    <div
      class="flex flex-wrap gap-3"
      :class="dragActive ? 'rounded-xl ring-2 ring-primary-200' : undefined"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div
        v-for="(slot, index) in slots"
        :key="slot.id"
        class="size-[5.5rem] shrink-0"
      >
        <div
          class="group relative size-[5.5rem] cursor-pointer overflow-hidden rounded-xl border border-grey-50 bg-grey-55"
          role="button"
          tabindex="0"
          @click="openPicker(index)"
          @keydown.enter.prevent="openPicker(index)"
        >
          <img :src="slot.src" :alt="slot.alt" class="size-full object-cover">

          <div
            class="absolute right-1 top-1 flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100"
            @click.stop
          >
            <button
              type="button"
              class="flex size-6 cursor-pointer items-center justify-center rounded-full border border-grey-50 bg-white/95 text-grey-700 shadow-sm transition hover:border-grey-100 hover:text-grey-900"
              aria-label="Replace banner"
              @click="openPicker(index)"
            >
              <Pencil class="size-3" />
            </button>
            <button
              type="button"
              class="flex size-6 cursor-pointer items-center justify-center rounded-full border border-grey-50 bg-white/95 text-grey-700 shadow-sm transition hover:border-negative-100 hover:text-negative-500"
              aria-label="Remove banner"
              @click="emit('remove', index)"
            >
              <Trash2 class="size-3" />
            </button>
          </div>
        </div>
      </div>

      <button
        v-if="canAddMore"
        type="button"
        class="size-[5.5rem] shrink-0 cursor-pointer"
        @click="openPicker(null)"
      >
        <div
          class="flex size-[5.5rem] items-center justify-center rounded-xl border border-dashed border-grey-100 bg-grey-55 text-grey-400 transition hover:border-primary-200 hover:text-primary-500"
          :class="dragActive ? 'border-primary-300 bg-primary-50/50' : undefined"
        >
          <Plus class="size-5 stroke-[1.5]" />
        </div>
      </button>
    </div>

    <p class="mt-3 text-sm text-grey-500">
      Drag or click to add up to {{ MARKETPLACE_BANNER_SLOT_COUNT }} square banner images.
    </p>
  </div>
</template>
