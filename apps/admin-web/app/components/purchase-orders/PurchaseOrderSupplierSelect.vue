<script setup lang="ts">
import {
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SearchField,
} from '@gosource/ui';
import { ChevronDown } from 'lucide-vue-next';
import { useDebounce } from '@vueuse/core';
import { PRODUCT_ITEM_SELECT_TRIGGER_CLASS } from '~/lib/product-form';
import { parseSupplierOptions } from '~/lib/purchase-order-api';

const modelValue = defineModel<string[]>({ default: () => [] });

defineProps<{
  invalid?: boolean;
}>();

const emit = defineEmits<{
  registerContact: [option: { id: string; label: string; email: string }];
}>();

const open = ref(false);
const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 300);

const supplierQuery = computed(() => ({
  name: debouncedSearch.value.trim(),
  page: 1,
  limit: 50,
}));

const { data, pending } = await useFetch<unknown>('/api/admins/search', {
  query: supplierQuery,
  watch: [supplierQuery],
});

const options = computed(() => parseSupplierOptions(data.value));
const selectedSet = computed(() => new Set(modelValue.value));
const selectedLabels = computed(() =>
  options.value
    .filter((option) => selectedSet.value.has(option.id))
    .map((option) => option.label),
);

function toggleSupplier(id: string) {
  const next = new Set(modelValue.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
    const option = options.value.find((entry) => entry.id === id);
    if (option) {
      emit('registerContact', option);
    }
  }
  modelValue.value = [...next];
}

function onOpenChange(nextOpen: boolean) {
  open.value = nextOpen;
  if (!nextOpen) {
    searchQuery.value = '';
  }
}
</script>

<template>
  <Popover :open="open" @update:open="onOpenChange">
    <PopoverTrigger as-child>
      <button
        type="button"
        :class="[PRODUCT_ITEM_SELECT_TRIGGER_CLASS, invalid ? 'border-negative-500' : '']"
      >
        <span
          class="truncate text-left"
          :class="selectedLabels.length > 0 ? 'text-grey-900' : 'text-grey-400'"
        >
          {{
            selectedLabels.length > 0
              ? selectedLabels.join(', ')
              : 'Select suppliers'
          }}
        </span>
        <ChevronDown class="size-4 shrink-0 text-grey-300" />
      </button>
    </PopoverTrigger>

    <PopoverContent align="start" class="w-[var(--reka-popover-trigger-width)] p-0">
      <div class="border-b border-grey-50 p-2">
        <SearchField v-model="searchQuery" placeholder="Search suppliers" />
      </div>

      <div class="max-h-64 overflow-y-auto p-2">
        <p v-if="pending" class="px-2 py-3 text-sm text-grey-500">Loading suppliers...</p>

        <label
          v-for="option in options"
          :key="option.id"
          class="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-grey-55"
        >
          <Checkbox
            :model-value="selectedSet.has(option.id)"
            @update:model-value="toggleSupplier(option.id)"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-grey-900">
              {{ option.label }}
            </span>
            <span class="block truncate text-xs text-grey-500">{{ option.email }}</span>
          </span>
        </label>

        <p v-if="!pending && options.length === 0" class="px-2 py-4 text-sm text-grey-500">
          No suppliers found
        </p>
      </div>

      <div class="border-t border-grey-50 px-3 py-2 text-xs text-grey-500">
        {{ modelValue.length }} selected
      </div>
    </PopoverContent>
  </Popover>
</template>
