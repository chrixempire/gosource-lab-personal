<script setup lang="ts">
import { StatusTag, StatusTagSelect } from '@gosource/ui';
import {
  isOrderPaymentStatusManuallyUpdatable,
  ORDER_PAYMENT_STATUS_OPTIONS,
} from '~/lib/order-constants';
import { getOrderPaymentStatusVariant } from '~/lib/order-details';
import type { OrderPaymentStatus } from '~/types/orders';

const props = defineProps<{
  orderId: string;
  status: OrderPaymentStatus;
  statusLabel: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [status: OrderPaymentStatus];
}>();

const isUpdatable = computed(() => isOrderPaymentStatusManuallyUpdatable(props.status));
</script>

<template>
  <StatusTagSelect
    v-if="isUpdatable"
    :value="status"
    :label="statusLabel"
    :variant="getOrderPaymentStatusVariant(status)"
    :options="ORDER_PAYMENT_STATUS_OPTIONS"
    :disabled="disabled"
    @change="emit('change', $event as OrderPaymentStatus)"
  />
  <StatusTag
    v-else
    :variant="getOrderPaymentStatusVariant(status)"
    size="medium"
    class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
  >
    {{ statusLabel }}
  </StatusTag>
</template>
