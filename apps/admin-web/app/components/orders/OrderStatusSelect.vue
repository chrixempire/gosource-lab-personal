<script setup lang="ts">
import { StatusTag, StatusTagSelect } from '@gosource/ui';
import { isOrderStatusManuallyUpdatable, ORDER_STATUS_CHANGE_OPTIONS } from '~/lib/order-constants';
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

const isUpdatable = computed(() => isOrderStatusManuallyUpdatable(props.status));
</script>

<template>
  <StatusTagSelect
    v-if="isUpdatable"
    :value="status"
    :label="statusLabel"
    :variant="getOrderStatusVariant(status)"
    :options="ORDER_STATUS_CHANGE_OPTIONS"
    :disabled="disabled"
    @change="emit('change', $event as OrderStatus)"
  />
  <StatusTag
    v-else
    :variant="getOrderStatusVariant(status)"
    size="medium"
    class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
  >
    {{ statusLabel }}
  </StatusTag>
</template>
