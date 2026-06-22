<script setup lang="ts">
import { Checkbox, StatusTag } from '@gosource/ui';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import AdminTableRowIndex from '~/components/shared/AdminTableRowIndex.vue';
import type { AdminOrderLineItem } from '~/lib/order-details';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';

const props = defineProps<{
  items: AdminOrderLineItem[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
}>();

const emit = defineEmits<{
  toggleSelect: [itemId: string, selected: boolean];
}>();

function isSelected(itemId: string) {
  return props.selectedIds?.includes(itemId) ?? false;
}
</script>

<template>
  <AdminMobileCardsSkeleton v-if="loading" :count="6" />

  <p
    v-else-if="!items.length"
    class="rounded-xl border border-grey-50 bg-white px-4 py-6 text-center text-sm text-grey-300"
  >
    No line items.
  </p>

  <div v-else :class="CREDIT_CARDS_GRID_CLASS">
    <article
      v-for="(item, index) in items"
      :key="item.id"
      :class="[CREDIT_CARD_SHELL_CLASS, 'cursor-default hover:bg-white hover:border-grey-50']"
    >
      <div class="flex items-center gap-3">
        <Checkbox
          v-if="selectable"
          :model-value="isSelected(item.id)"
          :disabled="item.isDelivered"
          @update:model-value="emit('toggleSelect', item.id, Boolean($event))"
        />
        <AdminTableRowIndex :value="index + 1" />
        <p class="min-w-0 flex-1 text-sm font-semibold text-grey-900">{{ item.name }}</p>
      </div>

      <div class="mt-4 grid w-full grid-cols-2 gap-3">
        <AdminMobileCardStat label="Qty">{{ item.quantity }}</AdminMobileCardStat>
        <AdminMobileCardStat label="Unit">{{ item.unit }}</AdminMobileCardStat>
        <AdminMobileCardStat label="Status">
          <StatusTag
            :variant="item.statusVariant"
            size="medium"
            class="rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold normal-case"
          >
            {{ item.statusLabel }}
          </StatusTag>
        </AdminMobileCardStat>
        <AdminMobileCardStat label="Total">{{ item.lineTotalLabel }}</AdminMobileCardStat>
      </div>
    </article>
  </div>
</template>
