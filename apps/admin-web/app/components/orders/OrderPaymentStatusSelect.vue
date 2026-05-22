<script setup lang="ts">
import { StatusTagSelect } from '@gosource/ui';
import { ORDER_PAYMENT_STATUS_OPTIONS } from '~/lib/order-constants';
import { getOrderPaymentStatusVariant } from '~/lib/order-details';
import type { OrderPaymentStatus } from '~/types/orders';

defineProps<{
  orderId: string;
  status: OrderPaymentStatus;
  statusLabel: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [status: OrderPaymentStatus];
}>();
</script>

<template>
  <StatusTagSelect
    :value="status"
    :label="statusLabel"
    :variant="getOrderPaymentStatusVariant(status)"
    :options="ORDER_PAYMENT_STATUS_OPTIONS"
    :disabled="disabled"
    @change="emit('change', $event as OrderPaymentStatus)"
  />
</template>
