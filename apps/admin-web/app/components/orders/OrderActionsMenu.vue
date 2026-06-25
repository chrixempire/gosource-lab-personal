<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Ellipsis } from 'lucide-vue-next';
import { isOrderCancellable } from '~/lib/order-constants';
import type { AdminOrderListItem } from '~/types/orders';

defineProps<{
  order: AdminOrderListItem;
  loading?: boolean;
}>();

const emit = defineEmits<{
  view: [];
  download: [variant: 'combined' | 'original' | 'added'];
  cancel: [];
  addItems: [];
  editItems: [];
}>();
</script>

<template>
  <div class="shrink-0" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          size="icon"
          variant="ghost"
          class="!size-9 !rounded-full !border !border-grey-50 !bg-white !p-0"
          aria-label="Order actions"
          :loading="loading"
          :disabled="loading"
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-52">
        <DropdownMenuItem @select="emit('view')">View details</DropdownMenuItem>
        <DropdownMenuItem
          v-if="order.isEditable"
          @select="emit('addItems')"
        >
          Add items
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="order.isEditable && order.hasAdditionalItems"
          @select="emit('editItems')"
        >
          Edit added items
        </DropdownMenuItem>
        <template v-if="order.hasAdditionalItems">
          <DropdownMenuItem @select="emit('download', 'original')">
            Download invoice (order items)
          </DropdownMenuItem>
          <DropdownMenuItem @select="emit('download', 'added')">
            Download invoice (added items)
          </DropdownMenuItem>
        </template>
        <DropdownMenuItem v-else @select="emit('download', 'combined')">
          Download invoice
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="isOrderCancellable(order)"
          class="text-negative-500"
          @select="emit('cancel')"
        >
          Cancel order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
