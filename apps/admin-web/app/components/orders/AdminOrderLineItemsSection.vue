<script setup lang="ts">
import { Button } from '@gosource/ui';
import AdminOrderLineItemsTable from '~/components/orders/AdminOrderLineItemsTable.vue';
import OrderMarkDeliveredDialog from '~/components/orders/OrderMarkDeliveredDialog.vue';
import { useOrderMutations } from '~/composables/useOrderMutations';
import type { AdminOrderLineItem } from '~/lib/order-details';
import type { OrderPaymentStatus, OrderStatus } from '~/types/orders';

const props = defineProps<{
  items: AdminOrderLineItem[];
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const { markProductsDelivered, updatingOrderId } = useOrderMutations();

const selectionMode = ref(false);
const selectedIds = ref<string[]>([]);
const confirmOpen = ref(false);

const showDeliveryActions = computed(() => {
  const paymentAllowed = ['paid', 'partial'].includes(props.paymentStatus);
  const hasUndelivered = props.items.some((item) => !item.isDelivered);
  const orderNotDelivered = props.orderStatus !== 'delivered';

  return paymentAllowed && hasUndelivered && orderNotDelivered;
});

const isUpdating = computed(
  () => props.disabled || updatingOrderId.value === props.orderId,
);

function resetSelection() {
  selectionMode.value = false;
  selectedIds.value = [];
}

function handleStartSelection() {
  if (!selectionMode.value) {
    selectionMode.value = true;
    return;
  }

  if (selectedIds.value.length === 0) {
    return;
  }

  confirmOpen.value = true;
}

function toggleSelection(itemId: string, selected: boolean) {
  if (selected) {
    if (!selectedIds.value.includes(itemId)) {
      selectedIds.value = [...selectedIds.value, itemId];
    }
    return;
  }

  selectedIds.value = selectedIds.value.filter((id) => id !== itemId);
}

async function handleConfirmDelivered() {
  try {
    await markProductsDelivered(props.orderId, selectedIds.value);
    confirmOpen.value = false;
    resetSelection();
    emit('updated');
  } catch {
    // toast in composable
  }
}

watch(
  () => props.items,
  () => {
    selectedIds.value = selectedIds.value.filter((id) =>
      props.items.some((item) => item.id === id && !item.isDelivered),
    );
  },
);
</script>

<template>
  <section class="rounded-[18px] border border-grey-50 bg-white p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-grey-900">Line items</h2>
      <div v-if="showDeliveryActions" class="flex items-center gap-2">
        <Button
          v-if="selectionMode"
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit"
          :disabled="isUpdating"
          @click="resetSelection"
        >
          Cancel
        </Button>
        <Button
          type="button"
          :variant="selectionMode ? 'primary' : 'secondary'"
          size="small"
          class="!w-fit"
          :disabled="isUpdating || (selectionMode && selectedIds.length === 0)"
          @click="handleStartSelection"
        >
          {{ selectionMode ? 'Mark as delivered' : 'Set individual status' }}
        </Button>
      </div>
    </div>

    <AdminOrderLineItemsTable
      :items="items"
      :loading="loading"
      :selectable="selectionMode"
      :selected-ids="selectedIds"
      @toggle-select="toggleSelection"
    />

    <OrderMarkDeliveredDialog
      v-model:open="confirmOpen"
      :loading="isUpdating"
      @confirm="handleConfirmDelivered"
    />
  </section>
</template>
