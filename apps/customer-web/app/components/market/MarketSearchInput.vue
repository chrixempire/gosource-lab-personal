<script setup lang="ts">
import { Input } from '@gosource/ui';
import { Loader2, Search, X } from 'lucide-vue-next';

const query = defineModel<string>({ required: true });

const props = defineProps<{
  isSearching?: boolean;
  showActionButton?: boolean;
}>();

const emit = defineEmits<{
  focus: [];
  input: [];
}>();

const inputRef = ref<{ $el?: HTMLInputElement } | HTMLInputElement | null>(null);

function resolveInput(): HTMLInputElement | null {
  const node = inputRef.value;
  if (!node) {
    return null;
  }
  if (node instanceof HTMLInputElement) {
    return node;
  }
  return node.$el instanceof HTMLInputElement ? node.$el : null;
}

function focus() {
  resolveInput()?.focus({ preventScroll: true });
}

function clear() {
  query.value = '';
  nextTick(focus);
}

defineExpose({ focus, clear });
</script>

<template>
  <div class="relative w-full">
    <Search
      class="pointer-events-none absolute left-3.5 top-1/2 z-[1] size-4 -translate-y-1/2 text-grey-400"
      aria-hidden="true"
    />

    <Input
      ref="inputRef"
      v-model="query"
      type="text"
      autocomplete="off"
      placeholder="Search.."
      aria-label="Search categories and products"
      :class="`!h-10 !rounded-xl !border-grey-50 !bg-grey-55 !pl-10 text-sm shadow-none transition-colors duration-300 focus:!border-primary-500 focus:!bg-background-on-canvas ${props.showActionButton ? '!pr-9' : '!pr-4'}`"
      @focus="emit('focus')"
      @input="emit('input')"
    />

    <button
      v-if="props.showActionButton"
      type="button"
      :class="[
        'absolute right-2.5 top-1/2 z-[1] flex size-4 -translate-y-1/2 cursor-pointer items-center justify-center transition-colors',
        props.isSearching
          ? 'bg-transparent'
          : 'rounded-full bg-grey-300 text-white hover:bg-grey-400',
      ]"
      :aria-label="props.isSearching ? 'Searching' : 'Clear search'"
      @mousedown.prevent
      @click.stop="props.isSearching ? undefined : clear()"
    >
      <Loader2 v-if="props.isSearching" class="size-4 animate-spin text-primary-500" />
      <X v-else class="size-3 stroke-[2.5]" />
    </button>
  </div>
</template>
