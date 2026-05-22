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
}>();

const emit = defineEmits<{
  view: [];
  download: [];
  cancel: [];
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
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-52">
        <DropdownMenuItem @select="emit('view')">View details</DropdownMenuItem>
        <DropdownMenuItem @select="emit('download')">Download invoice</DropdownMenuItem>
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
