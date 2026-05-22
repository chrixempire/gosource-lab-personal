<script setup lang="ts">
import { Button, SearchField, ViewToggle, toast } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Download } from 'lucide-vue-next';
import CustomerCardsGrid from '~/components/customers/CustomerCardsGrid.vue';
import CustomerAccountActionDialog from '~/components/customers/CustomerAccountActionDialog.vue';
import type { CustomerAccountActionMode } from '~/components/customers/CustomerAccountActionDialog.vue';
import CustomerCreditDialog from '~/components/customers/CustomerCreditDialog.vue';
import CustomerFilterBar from '~/components/customers/CustomerFilterBar.vue';
import CustomerStatCards from '~/components/customers/CustomerStatCards.vue';
import CustomerTable from '~/components/customers/CustomerTable.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useCustomerListFilters } from '~/composables/useCustomerListFilters';
import { useCustomerMutations } from '~/composables/useCustomerMutations';
import { customerDetailPath } from '~/lib/admin-routes';
import {
  computeCustomerStats,
  parseCustomersListResponse,
} from '~/lib/customer-api';
import { downloadCustomersCsv } from '~/lib/customer-export';
import { customerListFiltersToApiQuery } from '~/lib/customer-filters';
import type { AdminCustomerListItem, CustomerAccountType } from '~/types/customers';

const { updateHeader } = useAdminHeader();
const { filters, replaceFilters, resetFilters, setPage, setLimit } = useCustomerListFilters();
const { routeView, effectiveView, isCompactViewport, setView } =
  useCollectionRouteState('table');
const {
  busyCustomerId,
  setCustomerCredit,
  resetCustomerPassword,
  setCustomerActive,
  deleteCustomer,
} = useCustomerMutations();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 500);
const selectedIds = ref<string[]>([]);
const creditDialogOpen = ref(false);
const creditEnable = ref(false);
const creditCustomer = ref<AdminCustomerListItem | null>(null);
const accountActionCustomer = ref<AdminCustomerListItem | null>(null);
const accountActionOpen = ref(false);
const accountActionMode = ref<CustomerAccountActionMode>('resetPassword');

const accountActionBusy = computed(
  () =>
    Boolean(
      accountActionCustomer.value &&
        accountActionOpen.value &&
        busyCustomerId.value === accountActionCustomer.value.id,
    ),
);

const creditActionBusy = computed(
  () =>
    Boolean(
      creditCustomer.value &&
        creditDialogOpen.value &&
        busyCustomerId.value === creditCustomer.value.id,
    ),
);

const apiQuery = computed(() => customerListFiltersToApiQuery(filters.value));

const { data, pending, error, refresh } = await useFetch<unknown>('/api/customers', {
  query: apiQuery,
  watch: [apiQuery],
});

const parsed = computed(() =>
  parseCustomersListResponse(data.value, filters.value.page, filters.value.limit),
);

const rows = computed(() => parsed.value.rows);
const meta = computed(() => parsed.value.meta);

const stats = computed(() => computeCustomerStats(rows.value, meta.value.total));

const activeAccountType = computed(() => {
  if (filters.value.accountType.length === 1) {
    return filters.value.accountType[0]!;
  }
  return null;
});

watch(
  () => filters.value.search,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
  { immediate: true },
);

watch(debouncedSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === filters.value.search) {
    return;
  }
  replaceFilters({ search: trimmed, page: 1 });
});

function onFilterAccountType(type: string | null) {
  replaceFilters({
    accountType: type ? [type as CustomerAccountType] : [],
    page: 1,
  });
}

function onView(customer: AdminCustomerListItem) {
  void navigateTo(customerDetailPath(customer.id));
}

function onToggleCredit(customer: AdminCustomerListItem) {
  creditCustomer.value = customer;
  creditEnable.value = !customer.useCredit;
  accountActionOpen.value = false;
  creditDialogOpen.value = true;
}

async function onCreditConfirm() {
  if (!creditCustomer.value) {
    return;
  }
  try {
    await setCustomerCredit(creditCustomer.value.id, creditEnable.value);
    creditDialogOpen.value = false;
    creditCustomer.value = null;
    await refresh();
  } catch {
    // toast in composable
  }
}

function openAccountAction(customer: AdminCustomerListItem, mode: CustomerAccountActionMode) {
  creditDialogOpen.value = false;
  accountActionCustomer.value = customer;
  accountActionMode.value = mode;
  accountActionOpen.value = true;
}

function onResetPasswordRequest(customer: AdminCustomerListItem) {
  openAccountAction(customer, 'resetPassword');
}

function onActivateRequest(customer: AdminCustomerListItem) {
  openAccountAction(customer, 'activate');
}

function onDeactivateRequest(customer: AdminCustomerListItem) {
  openAccountAction(customer, 'deactivate');
}

function onDeleteAccountRequest(customer: AdminCustomerListItem) {
  openAccountAction(customer, 'delete');
}

async function onAccountActionConfirm() {
  if (!accountActionCustomer.value) {
    return;
  }

  const customer = accountActionCustomer.value;
  const mode = accountActionMode.value;

  try {
    if (mode === 'resetPassword') {
      await resetCustomerPassword(customer.id);
    } else if (mode === 'activate') {
      await setCustomerActive(customer.id, true);
    } else if (mode === 'deactivate') {
      await setCustomerActive(customer.id, false);
    } else if (mode === 'delete') {
      await deleteCustomer(customer.id);
    }

    accountActionOpen.value = false;
    accountActionCustomer.value = null;
    await refresh();
  } catch {
    // toast in composable
  }
}

function onExportCsv() {
  if (rows.value.length === 0) {
    toast.error('No customers to export');
    return;
  }
  downloadCustomersCsv(rows.value);
}

updateHeader({ title: 'Customers' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div
      class="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
    >
      <p class="max-w-xl text-sm text-grey-600">
        Search and manage business and individual customers, credit access, and account details.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="Download"
        @click="onExportCsv"
      >
        Export
      </Button>
    </div>

    <CustomerStatCards
      :active-account-type="activeAccountType"
      :stats="stats"
      @filter-account-type="onFilterAccountType"
    />

    <div
      class="flex flex-col gap-4 min-[1000px]:flex-row min-[1000px]:items-end min-[1000px]:justify-between"
    >
      <div class="w-full min-[1000px]:max-w-md">
        <SearchField
          v-model="searchQuery"
          placeholder="Search customers"
          :disabled="pending && rows.length === 0"
        />
      </div>
      <ViewToggle
        v-if="!isCompactViewport"
        :model-value="routeView"
        @update:model-value="setView"
      />
    </div>

    <CustomerFilterBar :filters="filters" @apply="replaceFilters" @clear-all="resetFilters" />

    <EmptyState
      v-if="effectiveView === 'cards' && error && rows.length === 0"
      title="Unable to load customers"
      :description="error.message || 'Please try again.'"
    >
      <button type="button" class="text-sm font-medium text-primary-600" @click="refresh()">
        Retry
      </button>
    </EmptyState>

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && rows.length === 0"
      title="No customers found"
      description="Adjust your search or filters to find customers."
    />

    <template v-else>
      <CustomerCardsGrid
        v-if="effectiveView === 'cards'"
        v-model:selected-ids="selectedIds"
        :customers="rows"
        :meta="meta"
        :loading="pending"
        :busy-customer-id="busyCustomerId"
        @page="setPage"
        @page-size="setLimit"
        @view="onView"
        @toggle-credit="onToggleCredit"
        @reset-password="onResetPasswordRequest"
        @activate="onActivateRequest"
        @deactivate-account="onDeactivateRequest"
        @delete-account="onDeleteAccountRequest"
      />
      <CustomerTable
        v-else
        v-model:selected-ids="selectedIds"
        :customers="rows"
        :meta="meta"
        :loading="pending"
        :busy-customer-id="busyCustomerId"
        @page="setPage"
        @page-size="setLimit"
        @view="onView"
        @toggle-credit="onToggleCredit"
        @reset-password="onResetPasswordRequest"
        @activate="onActivateRequest"
        @deactivate-account="onDeactivateRequest"
        @delete-account="onDeleteAccountRequest"
      />
    </template>

    <CustomerCreditDialog
      v-model:open="creditDialogOpen"
      :enable="creditEnable"
      :customer-name="creditCustomer?.displayName"
      :loading="creditActionBusy"
      @confirm="onCreditConfirm"
    />

    <CustomerAccountActionDialog
      v-model:open="accountActionOpen"
      :mode="accountActionMode"
      :customer-name="accountActionCustomer?.displayName"
      :customer-email="accountActionCustomer?.email"
      :loading="accountActionBusy"
      @confirm="onAccountActionConfirm"
    />
  </div>
</template>
