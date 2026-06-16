<script setup lang="ts">
import {
  Checkbox,
  PaginationBar,
  StatusTag,
  Switch,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import CustomerActionsMenu from '~/components/customers/CustomerActionsMenu.vue';
import { customerAccountTypeVariant, customerStatusVariant } from '~/lib/customer-constants';
import {
  CUSTOMER_LIST_PANEL_CLASS,
  CUSTOMER_TABLE_GRID_TEMPLATE,
} from '~/lib/customers-table-layout';
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

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (props.customers.length === 0) return false;
  const n = props.customers.filter((c) => selectedSet.value.has(c.id)).length;
  if (n === 0) return false;
  if (n === props.customers.length) return true;
  return 'indeterminate';
});

function toggleAll(value: boolean | 'indeterminate') {
  if (value === false) {
    const ids = new Set(props.customers.map((c) => c.id));
    selectedIds.value = selectedIds.value.filter((id) => !ids.has(id));
    return;
  }
  const merged = new Set(selectedIds.value);
  props.customers.forEach((c) => merged.add(c.id));
  selectedIds.value = [...merged];
}

function toggleRow(id: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedIds.value);
  if (checked === true) next.add(id);
  else next.delete(id);
  selectedIds.value = [...next];
}
</script>

<template>
  <TableShell :class="[CUSTOMER_LIST_PANEL_CLASS, 'overflow-visible']">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: CUSTOMER_TABLE_GRID_TEMPLATE }">
        <TableCell class="flex items-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all customers"
            @update:model-value="toggleAll"
            @click.stop
          />
        </TableCell>
        <TableCell>Customer</TableCell>
        <TableCell>Phone</TableCell>
        <TableCell>Account type</TableCell>
        <TableCell>Date joined</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Use credit</TableCell>
        <TableCell />
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 flex-1">
      <TableSkeleton
        :columns="Array(8).fill({ kind: 'line' as const, lineClass: 'w-full' })"
        :grid-template-columns="CUSTOMER_TABLE_GRID_TEMPLATE"
        :row-count="10"
      />
    </div>

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-if="customers.length === 0"
        :style="{ gridTemplateColumns: CUSTOMER_TABLE_GRID_TEMPLATE }"
      >
        <TableCell />
        <TableCell class="col-span-7 py-12 text-center text-sm text-grey-500">
          No customers found
        </TableCell>
      </TableRow>
      <template v-else>
        <TableRow
          v-for="customer in customers"
          :key="customer.id"
          class="cursor-pointer transition-colors hover:bg-primary-50/45"
          :style="{ gridTemplateColumns: CUSTOMER_TABLE_GRID_TEMPLATE }"
          @click="emit('view', customer)"
        >
          <TableCell class="flex items-center" @click.stop>
            <Checkbox
              :model-value="selectedSet.has(customer.id)"
              @update:model-value="toggleRow(customer.id, $event)"
            />
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-3">
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-full border border-grey-50 bg-grey-55 text-sm font-semibold text-grey-700"
                :class="customer.accountType === 'individual' ? '' : 'rounded-xl'"
              >
                {{ customer.initials }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-grey-900">{{ customer.displayName }}</p>
                <p class="truncate text-xs text-grey-500">{{ customer.email }}</p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <p class="text-sm text-grey-800">{{ customer.phoneNumber }}</p>
          </TableCell>
          <TableCell>
            <StatusTag
              :variant="customerAccountTypeVariant(customer.accountType)"
              size="medium"
            >
              {{ customer.accountTypeLabel }}
            </StatusTag>
          </TableCell>
          <TableCell>
            <p class="text-sm text-grey-700">{{ customer.createdAtLabel }}</p>
          </TableCell>
          <TableCell>
            <StatusTag :variant="customerStatusVariant(customer.status)" size="medium">
              {{ customer.statusLabel }}
            </StatusTag>
          </TableCell>
          <TableCell @click.stop>
            <Switch
              :model-value="customer.useCredit"
              :disabled="busyCustomerId === customer.id"
              :aria-label="`Use credit for ${customer.displayName}`"
              @update:model-value="emit('toggleCredit', customer)"
            />
          </TableCell>
          <TableCell @click.stop>
            <CustomerActionsMenu
              :customer="customer"
              :loading="busyCustomerId === customer.id"
              @view="emit('view', customer)"
              @reset-password="emit('resetPassword', customer)"
              @activate="emit('activate', customer)"
              @deactivate-account="emit('deactivateAccount', customer)"
              @delete-account="emit('deleteAccount', customer)"
            />
          </TableCell>
        </TableRow>
      </template>
    </TableBody>

    <TableFooter v-if="!loading && meta.total > 0">
      <PaginationBar
        :page="meta.page"
        :page-size="meta.limit"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
