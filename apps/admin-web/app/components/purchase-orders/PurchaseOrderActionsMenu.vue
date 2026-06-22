<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Ellipsis, LoaderCircle } from 'lucide-vue-next';
import type { AdminPurchaseOrderListItem } from '~/types/purchase-orders';

const props = defineProps<{
  order: AdminPurchaseOrderListItem;
  disabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  viewInvoice: [];
  receive: [];
  edit: [];
  sendInvoice: [];
  download: [];
  cancelRemaining: [];
  deleteOrder: [];
}>();

const options = computed(() => {
  const status = props.order.status;

  if (status === 'pending') {
    return [
      { key: 'view', label: 'View invoice' },
      { key: 'receive', label: 'Receive' },
      { key: 'edit', label: 'Edit order' },
      { key: 'send', label: 'Send invoice' },
      { key: 'download', label: 'Download PDF' },
      { key: 'delete', label: 'Delete order', danger: true },
    ] as const;
  }

  if (status === 'partial') {
    return [
      { key: 'view', label: 'View invoice' },
      { key: 'receive', label: 'Receive' },
      { key: 'edit', label: 'Edit order' },
      { key: 'send', label: 'Send invoice' },
      { key: 'download', label: 'Download PDF' },
      { key: 'cancel', label: 'Cancel remaining items', danger: true },
    ] as const;
  }

  return [
    { key: 'view', label: 'View invoice' },
    { key: 'send', label: 'Send invoice' },
    { key: 'download', label: 'Download PDF' },
  ] as const;
});

function onSelect(key: string) {
  switch (key) {
    case 'view':
      emit('viewInvoice');
      break;
    case 'receive':
      emit('receive');
      break;
    case 'edit':
      emit('edit');
      break;
    case 'send':
      emit('sendInvoice');
      break;
    case 'download':
      emit('download');
      break;
    case 'cancel':
      emit('cancelRemaining');
      break;
    case 'delete':
      emit('deleteOrder');
      break;
  }
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
          :disabled="disabled || loading"
          aria-label="Purchase order actions"
        >
          <LoaderCircle v-if="loading" class="size-4 animate-spin text-primary-500" />
          <Ellipsis v-else class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-56">
        <DropdownMenuItem
          v-for="option in options"
          :key="option.key"
          :class="'danger' in option && option.danger ? 'text-negative-500' : undefined"
          @select="onSelect(option.key)"
        >
          {{ option.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
