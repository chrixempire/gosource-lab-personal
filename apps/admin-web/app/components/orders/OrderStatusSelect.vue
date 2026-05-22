<script setup lang="ts">
import { StatusTagSelect } from '@gosource/ui';
import { ORDER_STATUS_OPTIONS } from '~/lib/order-constants';
import { getOrderStatusVariant } from '~/lib/order-details';
import type { OrderStatus } from '~/types/orders';

const props = defineProps<{
  orderId: string;
  status: OrderStatus;
  statusLabel: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [status: OrderStatus];
}>();
</script>

<template>
  <StatusTagSelect
    :value="status"
    :label="statusLabel"
    :variant="getOrderStatusVariant(status)"
    :options="ORDER_STATUS_OPTIONS"
    :disabled="disabled"
    @change="emit('change', $event as OrderStatus)"
  />
</template>
