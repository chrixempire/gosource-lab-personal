<script setup lang="ts">
import { PaginationBar } from '@gosource/ui';
import CustomerCard from '~/components/customers/CustomerCard.vue';
import type { AdminCustomerListItem } from '~/types/customers';
import type { InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  customers: AdminCustomerListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  busyCustomerId?: string | null;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  view: [customer: AdminCustomerListItem];
  toggleCredit: [customer: AdminCustomerListItem];
  resetPassword: [customer: AdminCustomerListItem];
  activate: [customer: AdminCustomerListItem];
  deactivateAccount: [customer: AdminCustomerListItem];
  deleteAccount: [customer: AdminCustomerListItem];
}>();

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

function toggleSelect(id: string, selected: boolean) {
  const next = new Set(selectedIds.value);
  if (selected) next.add(id);
  else next.delete(id);
  selectedIds.value = [...next];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="loading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="h-56 animate-pulse rounded-[24px] border border-grey-50 bg-grey-55"
      />
    </div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <CustomerCard
        v-for="customer in customers"
        :key="customer.id"
        :customer="customer"
        :selected="selectedSet.has(customer.id)"
        :busy="busyCustomerId === customer.id"
        @toggle-select="toggleSelect"
        @view="emit('view', customer)"
        @toggle-credit="emit('toggleCredit', customer)"
        @reset-password="emit('resetPassword', customer)"
        @activate="emit('activate', customer)"
        @deactivate-account="emit('deactivateAccount', customer)"
        @delete-account="emit('deleteAccount', customer)"
      />
    </div>
    <PaginationBar
      v-if="!loading && customers.length > 0"
      :page="meta.page"
      :page-size="meta.limit"
      :total-pages="meta.totalPages"
      :total-items="meta.total"
      :has-next-page="meta.hasNext"
      :has-prev-page="meta.hasPrev"
      @change="emit('page', $event)"
      @page-size-change="emit('pageSize', $event)"
    />
  </div>
</template>
