<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Ellipsis } from 'lucide-vue-next';
import type { AdminDiscountListItem } from '~/types/discounts';

const props = defineProps<{ discount: AdminDiscountListItem; disabled?: boolean }>();
const emit = defineEmits<{
  copy: [];
  edit: [];
  activate: [];
  deactivate: [];
  delete: [];
}>();

const options = computed(() => {
  const status = props.discount.status;
  const base = [
    { key: 'copy', label: 'Copy coupon code' },
    { key: 'edit', label: 'Edit discount' },
  ];

  if (status === 'active') {
    return [...base, { key: 'deactivate', label: 'Deactivate', danger: true }];
  }
  if (status === 'deactivated') {
    return [...base, { key: 'activate', label: 'Re-activate' }];
  }
  if (status === 'inactive' || status === 'expired') {
    return base;
  }
  if (status === 'used') {
    return [{ key: 'copy', label: 'Copy coupon code' }];
  }
  return base;
});

function onSelect(key: string) {
  if (key === 'copy') emit('copy');
  if (key === 'edit') emit('edit');
  if (key === 'activate') emit('activate');
  if (key === 'deactivate') emit('deactivate');
  if (key === 'delete') emit('delete');
}
</script>

<template>
  <div class="shrink-0" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          size="icon"
          variant="ghost"
          class="!size-9 !rounded-full !border !border-grey-50 !bg-white !p-0"
          :disabled="disabled"
          aria-label="Discount actions"
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-52">
        <DropdownMenuItem
          v-for="option in options"
          :key="option.key"
          :class="option.danger ? 'text-negative-500' : undefined"
          @select="onSelect(option.key)"
        >
          {{ option.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
