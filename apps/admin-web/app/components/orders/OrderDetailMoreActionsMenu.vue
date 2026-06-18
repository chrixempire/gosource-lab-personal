<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { ChevronDown, ChevronRight, Download } from 'lucide-vue-next';
import { ORDER_STATUS_CHANGE_OPTIONS } from '~/lib/order-constants';
import type { OrderStatus } from '~/types/orders';

defineProps<{
  canCancel?: boolean;
  canChangeStatus?: boolean;
  disabled?: boolean;
  invoiceLoading?: boolean;
}>();

const changeStatusOptions = ORDER_STATUS_CHANGE_OPTIONS;

const emit = defineEmits<{
  downloadInvoice: [];
  changeStatus: [status: OrderStatus];
  cancel: [];
}>();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        type="button"
        variant="primary"
        size="small"
        class="!w-fit shrink-0"
        :right-icon="ChevronDown"
        :loading="invoiceLoading"
        :disabled="disabled || invoiceLoading"
      >
        More actions
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-52">
      <DropdownMenuItem
        class="gap-2.5"
        :disabled="invoiceLoading"
        @select="emit('downloadInvoice')"
      >
        <Download class="size-4" />
        Download invoice
      </DropdownMenuItem>

      <DropdownMenuSub v-if="canChangeStatus">
        <DropdownMenuSubTrigger class="justify-between gap-2">
          Change status
          <ChevronRight class="size-4 shrink-0 text-grey-300" />
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent :side-offset="4" class="max-h-72 overflow-y-auto">
          <DropdownMenuItem
            v-for="option in changeStatusOptions"
            :key="option.value"
            @select="emit('changeStatus', option.value)"
          >
            {{ option.label }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuItem
        v-if="canCancel"
        class="text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!"
        @select="emit('cancel')"
      >
        Cancel order
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
