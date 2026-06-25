<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Pencil, Plus } from 'lucide-vue-next';
import AdminOrderLineItemsTable from '~/components/orders/AdminOrderLineItemsTable.vue';
import OrderEditItemsDrawer from '~/components/orders/OrderEditItemsDrawer.vue';
import OrderMarkDeliveredDialog from '~/components/orders/OrderMarkDeliveredDialog.vue';
import { useOrderMutations } from '~/composables/useOrderMutations';
import type { AdminOrderAdditionalItem, AdminOrderLineItem } from '~/lib/order-details';
import type { OrderPaymentStatus, OrderStatus } from '~/types/orders';

const props = withDefaults(
  defineProps<{
    items: AdminOrderLineItem[];
    orderId: string;
    orderStatus: OrderStatus;
    paymentStatus: OrderPaymentStatus;
    additionalItems?: AdminOrderAdditionalItem[];
    editable?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    additionalItems: () => [],
    editable: false,
  },
);

const emit = defineEmits<{
  updated: [];
}>();

const {
  markProductsDelivered,
  addOrderProducts,
  updateOrderProducts,
  updatingOrderId,
} = useOrderMutations();

const drawerOpen = ref(false);
const drawerMode = ref<'add' | 'edit'>('add');

const additionalLineItems = computed<AdminOrderLineItem[]>(() =>
  props.additionalItems.map((item) => ({
    id: item.cartId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    lineTotal: item.lineTotal,
    lineTotalLabel: item.lineTotalLabel,
    status: 'pending',
    isDelivered: false,
    // Added items sit in additionalProducts until the customer pays, at which
    // point they merge into the order's products — so they're awaiting payment.
    statusLabel: 'Pending payment',
    statusVariant: 'warning' as const,
  })),
);

function openAddItems() {
  drawerMode.value = 'add';
  drawerOpen.value = true;
}

function openEditItems() {
  drawerMode.value = 'edit';
  drawerOpen.value = true;
}

async function onAddItems(
  products: { product: string; unit: string; quantity: number }[],
) {
  try {
    await addOrderProducts(props.orderId, products);
    drawerOpen.value = false;
    emit('updated');
  } catch {
    // toast in composable
  }
}

async function onUpdateItems(
  products: {
    cartId: string;
    productId: string;
    newQuantity: number;
    unit: string;
  }[],
) {
  try {
    await updateOrderProducts(props.orderId, products);
    drawerOpen.value = false;
    emit('updated');
  } catch {
    // toast in composable
  }
}

const selectionMode = ref(false);
const selectedIds = ref<string[]>([]);
const confirmOpen = ref(false);

const showDeliveryActions = computed(() => {
  const paymentAllowed = ['paid', 'partial'].includes(props.paymentStatus);
  const hasUndelivered = props.items.some((item) => !item.isDelivered);
  const orderNotDelivered = props.orderStatus !== 'delivered';
  // With a single line item there's nothing to "set individually" —
  // the whole-order status covers it.
  const hasMultipleItems = props.items.length > 1;

  return paymentAllowed && hasUndelivered && orderNotDelivered && hasMultipleItems;
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
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="editable"
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit whitespace-nowrap"
          :left-icon="Plus"
          :disabled="isUpdating"
          @click="openAddItems"
        >
          Add items
        </Button>
        <template v-if="showDeliveryActions">
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
        </template>
      </div>
    </div>

    <AdminOrderLineItemsTable
      :items="items"
      :loading="loading"
      :selectable="selectionMode"
      :selected-ids="selectedIds"
      @toggle-select="toggleSelection"
    />

    <template v-if="additionalLineItems.length > 0">
      <div class="mb-2 mt-4 flex items-center justify-between gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-grey-400">
          Added items
        </h3>
        <Button
          v-if="editable"
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit whitespace-nowrap"
          :left-icon="Pencil"
          :disabled="isUpdating"
          @click="openEditItems"
        >
          Edit items
        </Button>
      </div>
      <AdminOrderLineItemsTable :items="additionalLineItems" />
    </template>

    <OrderMarkDeliveredDialog
      v-model:open="confirmOpen"
      :loading="isUpdating"
      @confirm="handleConfirmDelivered"
    />

    <OrderEditItemsDrawer
      v-model:open="drawerOpen"
      :mode="drawerMode"
      :existing-items="additionalItems"
      :loading="isUpdating"
      @add="onAddItems"
      @update="onUpdateItems"
    />
  </section>
</template>
