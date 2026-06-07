<script setup lang="ts">
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import AdminTableRowIndex from '~/components/shared/AdminTableRowIndex.vue';
import type { AdminOrderLineItem } from '~/lib/order-details';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';

defineProps<{
  items: AdminOrderLineItem[];
  loading?: boolean;
}>();
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
        <AdminTableRowIndex :value="index + 1" />
        <p class="min-w-0 flex-1 text-sm font-semibold text-grey-900">{{ item.name }}</p>
      </div>

      <div class="mt-4 grid w-full grid-cols-2 gap-3">
        <AdminMobileCardStat label="Qty">{{ item.quantity }}</AdminMobileCardStat>
        <AdminMobileCardStat label="Unit">{{ item.unit }}</AdminMobileCardStat>
        <AdminMobileCardStat label="Total" class="col-span-2">
          {{ item.lineTotalLabel }}
        </AdminMobileCardStat>
      </div>
    </article>
  </div>
</template>
