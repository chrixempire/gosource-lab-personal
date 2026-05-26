<script setup lang="ts">
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@gosource/ui';
import OrderFilterChip from '~/components/orders/OrderFilterChip.vue';

const open = defineModel<boolean>('open', { default: false });

defineProps<{
  label: string;
  active?: boolean;
  badgeCount?: number;
  panelClass?: string;
}>();

const emit = defineEmits<{
  apply: [];
  clear: [];
}>();

function onApply() {
  emit('apply');
  open.value = false;
}

function onClear() {
  emit('clear');
  open.value = false;
}
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <OrderFilterChip :label="label" :active="active" :badge-count="badgeCount" />
    </DropdownMenuTrigger>

    <DropdownMenuContent
      :class="panelClass ?? 'w-[min(20rem,calc(100vw-2rem))] p-0'"
      align="start"
    >
      <div
        class="flex flex-col"
        @pointerdown.stop
        @click.stop
      >
        <div class="max-h-[min(20rem,60vh)] overflow-y-auto px-2 py-2">
          <slot />
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-grey-50 px-2 py-2">
          <Button type="button" size="small" variant="outline" @click="onClear">
            Clear
          </Button>
          <Button type="button" size="small" @click="onApply">
            Apply
          </Button>
        </div>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
