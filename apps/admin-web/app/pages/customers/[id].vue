<script setup lang="ts">
import { Button, StatusTag } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import CustomerAccountActionDialog from '~/components/customers/CustomerAccountActionDialog.vue';
import type { CustomerAccountActionMode } from '~/components/customers/CustomerAccountActionDialog.vue';
import CustomerCreditDialog from '~/components/customers/CustomerCreditDialog.vue';
import CustomerBranchesTab from '~/components/customers/CustomerBranchesTab.vue';
import CustomerCreditHistoryTab from '~/components/customers/CustomerCreditHistoryTab.vue';
import CustomerActionsMenu from '~/components/customers/CustomerActionsMenu.vue';
import CustomerDetailPanel from '~/components/customers/CustomerDetailPanel.vue';
import CustomerOrdersTab from '~/components/customers/CustomerOrdersTab.vue';
import CustomerWalletDetailsCard from '~/components/customers/CustomerWalletDetailsCard.vue';
import CustomerWalletTab from '~/components/customers/CustomerWalletTab.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import LoadingState from '~/components/shared/LoadingState.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useCustomerMutations } from '~/composables/useCustomerMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { customerAccountTypeLabel, customerStatusVariant } from '~/lib/customer-constants';
import { parseCustomerDetail } from '~/lib/customer-api';

const CUSTOMER_TABS = [
  { value: 'wallet', label: 'Wallet' },
  { value: 'orders', label: 'Order history' },
  { value: 'branches', label: 'Branches' },
  { value: 'credit-history', label: 'Credit history' },
] as const;

type CustomerTab = (typeof CUSTOMER_TABS)[number]['value'];

const TAB_GAP_PX = 8;
const TAB_PADDING_PX = 4;

const route = useRoute();
const router = useRouter();
const { updateHeader } = useAdminHeader();
const {
  setCustomerCredit,
  resetCustomerPassword,
  setCustomerActive,
  deleteCustomer,
  busyCustomerId,
} = useCustomerMutations();

const customerId = computed(() => String(route.params.id ?? ''));

const activeTab = computed<CustomerTab>(() => {
  const tab = String(route.query.tab ?? 'wallet');
  return CUSTOMER_TABS.some((entry) => entry.value === tab) ? (tab as CustomerTab) : 'wallet';
});

const activeTabIndex = computed(() =>
  Math.max(
    0,
    CUSTOMER_TABS.findIndex((entry) => entry.value === activeTab.value),
  ),
);

const tabHighlightStyle = computed(() => ({
  width: `calc((100% - ${(CUSTOMER_TABS.length - 1) * TAB_GAP_PX + TAB_PADDING_PX * 2}px) / ${CUSTOMER_TABS.length})`,
  transform: `translateX(calc(${activeTabIndex.value} * (100% + ${TAB_GAP_PX}px)))`,
}));

const { data, pending, error, refresh } = await useAdminAuthenticatedFetch<unknown>(
  () => `/api/customers/${customerId.value}`,
  {
    watch: [customerId],
    key: computed(() => `admin-customer-detail:${customerId.value}`),
  },
);

const customer = computed(() => parseCustomerDetail(data.value));
const accountActionOpen = ref(false);
const accountActionMode = ref<CustomerAccountActionMode>('activate');
const creditDialogOpen = ref(false);
const creditEnable = ref(false);

const accountActionBusy = computed(
  () => Boolean(customer.value && accountActionOpen.value && busyCustomerId.value === customer.value.id),
);

const creditActionBusy = computed(
  () => Boolean(customer.value && creditDialogOpen.value && busyCustomerId.value === customer.value.id),
);

function setTab(tab: CustomerTab) {
  router.replace({ query: { ...route.query, tab } });
}

function onToggleCredit() {
  if (!customer.value) return;
  creditEnable.value = !customer.value.useCredit;
  accountActionOpen.value = false;
  creditDialogOpen.value = true;
}

async function onCreditConfirm() {
  if (!customer.value) return;
  try {
    await setCustomerCredit(customer.value.id, creditEnable.value);
    creditDialogOpen.value = false;
    await refresh();
  } catch {
    // toast in composable
  }
}

const actionCustomer = computed(() =>
  customer.value
    ? {
        id: customer.value.id,
        displayName: customer.value.displayName,
        email: customer.value.email,
        phoneNumber: customer.value.phoneNumber,
        accountType: customer.value.accountType,
        accountTypeLabel: customerAccountTypeLabel(customer.value.accountType),
        status: customer.value.status,
        statusLabel: customer.value.statusLabel,
        useCredit: customer.value.useCredit,
        createdAt: null,
        createdAtLabel: customer.value.createdAtLabel,
        initials: customer.value.displayName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join('')
          .toUpperCase() || 'CU',
      }
    : null,
);

function openAccountAction(mode: CustomerAccountActionMode) {
  if (!customer.value) return;
  accountActionMode.value = mode;
  accountActionOpen.value = true;
}

async function onAccountActionConfirm() {
  if (!customer.value) return;

  try {
    if (accountActionMode.value === 'resetPassword') {
      await resetCustomerPassword(customer.value.id);
      accountActionOpen.value = false;
      return;
    }

    if (accountActionMode.value === 'activate') {
      await setCustomerActive(customer.value.id, true);
      accountActionOpen.value = false;
      await refresh();
      return;
    }

    if (accountActionMode.value === 'deactivate') {
      await setCustomerActive(customer.value.id, false);
      accountActionOpen.value = false;
      await refresh();
      return;
    }

    if (accountActionMode.value === 'delete') {
      await deleteCustomer(customer.value.id);
      accountActionOpen.value = false;
      await navigateTo(ADMIN_PAGE_ROUTES.CUSTOMERS);
    }
  } catch {
    // toast is handled in the mutation composable
  }
}

updateHeader({
  title: 'Customer details',
  goBack: false,
});
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-4">
      <LoadingState v-if="pending && !customer" label="Loading customer…" class="w-full" />

      <LoadErrorState
        v-else-if="error && !customer"
        class="w-full"
        :error="error"
        load-failed-title="Unable to load customer"
        resource-label="customer"
        @retry="refresh()"
      />

      <template v-else-if="customer">
        <div class="flex items-center justify-between gap-3">
          <div class="w-fit self-start">
            <Button
              type="button"
              variant="secondary"
              size="small"
              class="!w-fit shrink-0"
              :left-icon="ChevronLeft"
              @click="navigateTo(ADMIN_PAGE_ROUTES.CUSTOMERS)"
            >
              Back to customers
            </Button>
          </div>

          <CustomerActionsMenu
            v-if="actionCustomer"
            :customer="actionCustomer"
            hide-view
            trigger-variant="button"
            @reset-password="openAccountAction('resetPassword')"
            @activate="openAccountAction('activate')"
            @deactivate-account="openAccountAction('deactivate')"
            @delete-account="openAccountAction('delete')"
          />
        </div>

        <div class="space-y-2">
          <div class="flex items-start gap-4">
            <div
              v-if="customer.imageUrl"
              class="size-20 overflow-hidden rounded-[28px] bg-primary-50"
            >
              <img :src="customer.imageUrl" :alt="customer.displayName" class="size-full object-cover" />
            </div>
            <div
              v-else
              class="flex size-20 items-center justify-center rounded-[28px] bg-primary-50 text-[2rem] font-semibold text-primary-700"
            >
              {{
                customer.displayName
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part.charAt(0))
                  .join('')
                  .toUpperCase()
              }}
            </div>

            <div class="min-w-0 space-y-2">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-h3 lg:text-h2">
                  {{ customer.displayName }}
                </h1>
                <StatusTag :variant="customerStatusVariant(customer.status)" size="medium">
                  {{ customer.statusLabel }}
                </StatusTag>
              </div>
              <p class="text-sm text-grey-600">{{ customer.contactName }}</p>
            </div>
          </div>
        </div>

        <div class="flex min-w-0 flex-col gap-5 xl:flex-row">
          <div class="w-full shrink-0 space-y-5 xl:max-w-sm">
            <CustomerDetailPanel
              :customer="customer"
              :busy="busyCustomerId === customer.id"
              @toggle-credit="onToggleCredit"
            />
            <CustomerWalletDetailsCard :customer="customer" />
          </div>

          <div class="min-w-0 flex-1">
            <section
              class="overflow-hidden rounded-xl border border-grey-50 bg-white shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
            >
              <div class="border-b border-grey-50 p-4">
                <div class="overflow-x-auto">
                  <div class="relative inline-grid min-w-[36rem] grid-cols-4 gap-2 rounded-2xl border border-grey-50 bg-white p-1">
                    <div
                      class="absolute bottom-2 left-2 top-2 rounded-xl bg-primary-50 transition-transform duration-300"
                      :style="tabHighlightStyle"
                    />
                    <button
                      v-for="tab in CUSTOMER_TABS"
                      :key="tab.value"
                      type="button"
                      class="relative z-10 cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                      :class="
                        activeTab === tab.value
                          ? 'text-primary-700'
                          : 'text-grey-600 hover:text-grey-900'
                      "
                      @click="setTab(tab.value)"
                    >
                      {{ tab.label }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="p-4 sm:p-5">
                <CustomerWalletTab
                  v-if="activeTab === 'wallet'"
                  :customer-id="customerId"
                  :wallet-balance="customer.walletBalance"
                />
                <CustomerOrdersTab
                  v-else-if="activeTab === 'orders'"
                  :customer-id="customerId"
                  :total-orders="customer.totalOrders"
                  :total-spent="customer.totalSpent"
                />
                <CustomerBranchesTab
                  v-else-if="activeTab === 'branches'"
                  :customer-id="customerId"
                  :total-branches="customer.totalBranches"
                  :total-employees="customer.totalEmployees"
                />
                <CustomerCreditHistoryTab
                  v-else-if="activeTab === 'credit-history'"
                  :customer-id="customer.id"
                />
              </div>
            </section>
          </div>
        </div>

        <CustomerCreditDialog
          v-model:open="creditDialogOpen"
          :enable="creditEnable"
          :customer-name="customer.displayName"
          :loading="creditActionBusy"
          @confirm="onCreditConfirm"
        />

        <CustomerAccountActionDialog
          v-model:open="accountActionOpen"
          :mode="accountActionMode"
          :customer-name="customer.displayName"
          :customer-email="customer.email"
          :loading="accountActionBusy"
          @confirm="onAccountActionConfirm"
        />
      </template>
    </div>
  </div>
</template>
