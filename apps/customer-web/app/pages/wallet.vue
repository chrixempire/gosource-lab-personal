<script setup lang="ts">
import type {
  CreateWalletPayload,
  CustomerMeResponse,
  WalletRecord,
  WalletTransactionRecord,
} from '@gosource/api-client';
import { Button, PaginationBar, ViewToggle, toast } from '@gosource/ui';
import { useDebounceFn } from '@vueuse/core';
import { Copy, Info, Plus } from 'lucide-vue-next';
import SearchField from '~/components/shared/collection/SearchField.vue';
import WalletCreateDialog from '~/components/wallet/WalletCreateDialog.vue';
import WalletFundDialog from '~/components/wallet/WalletFundDialog.vue';
import WalletTransactionCards from '~/components/wallet/WalletTransactionCards.vue';
import WalletTransactionDetailDialog from '~/components/wallet/WalletTransactionDetailDialog.vue';
import WalletPageSkeleton from '~/components/wallet/WalletPageSkeleton.vue';
import WalletTransactionsTable from '~/components/wallet/WalletTransactionsTable.vue';
import WalletTransactionsToolbarSkeleton from '~/components/wallet/WalletTransactionsToolbarSkeleton.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';

const runWhenSessionReady = useAuthenticatedFetch();
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import {
  canCopyWalletAccountNumber,
  formatWalletAccountDisplay,
  isWalletVirtualAccountPending,
} from '~/lib/wallet-display';
import { transactionMatchesReferenceSearch } from '~/lib/wallet-transaction-display';
import { formatRequestCurrency } from '~/lib/request-details';
import { useCustomerWalletService } from '~/services/wallet.service';
import { extractApiResponseMessage } from '~/utils/api-error';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const { getWallet, createWallet, listTransactions } = useCustomerWalletService();
const route = useRoute();
const router = useRouter();

const creating = ref(false);
const transactionsLoading = ref(false);
const fundDialogOpen = ref(false);
const createDialogOpen = ref(false);
const wallet = ref<WalletRecord | null>(null);
const transactions = ref<WalletTransactionRecord[]>([]);
const totalTransactions = ref(0);
const selectedTransactionIds = ref<string[]>([]);

const {
  effectiveView,
  routeView,
  isCompactViewport,
  page,
  limit,
  setPage,
  setLimit,
  setView,
} = useCollectionRouteState('table');

const transactionTypeOptions = [
  { label: 'All', value: 'all' as const },
  { label: 'Credit', value: 'credit' as const },
  { label: 'Debit', value: 'debit' as const },
];

type WalletTransactionTypeFilter = (typeof transactionTypeOptions)[number]['value'];

const transactionTypeValues = new Set<WalletTransactionTypeFilter>(['all', 'credit', 'debit']);
const transactionTab = computed<WalletTransactionTypeFilter>(() => {
  const raw = route.query.type;
  const value = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;

  if (value && transactionTypeValues.has(value as WalletTransactionTypeFilter)) {
    return value as WalletTransactionTypeFilter;
  }

  return 'all';
});
const searchValue = ref('');
const debouncedSearch = ref('');
const selectedTransaction = ref<WalletTransactionRecord | null>(null);
const transactionDetailOpen = ref(false);

const syncSearch = useDebounceFn((value: string) => {
  debouncedSearch.value = value;
}, 200);

watch(searchValue, (value) => {
  syncSearch(value);
});

watch(transactionTab, () => {
  selectedTransactionIds.value = [];
});

const isOwner = computed(() => isBusinessOwnerSession(session.value));
const businessId = computed(() => {
  const data = session.value?.data;
  if (!data || typeof data !== 'object') {
    return '';
  }
  const record = data as unknown as Record<string, unknown>;
  return String(('businessId' in record ? record.businessId : record.id) ?? '').trim();
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalTransactions.value / limit.value)),
);

const transactionMeta = computed(() => ({
  page: page.value,
  limit: limit.value,
  total: totalTransactions.value,
  totalPages: totalPages.value,
  hasNextPage: page.value < totalPages.value,
  hasPrevPage: page.value > 1,
}));

const typeFilteredTransactions = computed(() => {
  if (transactionTab.value === 'all') {
    return transactions.value;
  }
  return transactions.value.filter((row) => row.type === transactionTab.value);
});

const filteredTransactions = computed(() => {
  if (!debouncedSearch.value.trim()) {
    return typeFilteredTransactions.value;
  }

  return typeFilteredTransactions.value.filter((row) =>
    transactionMatchesReferenceSearch(row, debouncedSearch.value),
  );
});

const transactionsSearchActive = computed(() => debouncedSearch.value.trim().length > 0);

const visibleTransactionsLabel = computed(() => {
  if (transactionsSearchActive.value) {
    return `${filteredTransactions.value.length} shown on this page`;
  }
  return `${totalTransactions.value} transactions`;
});

const virtualAccountPending = computed(() => isWalletVirtualAccountPending(wallet.value));
const virtualAccountPollExhausted = ref(false);
const canCopyAccountNumber = computed(() => canCopyWalletAccountNumber(wallet.value));

const walletBankName = computed(() => formatWalletAccountDisplay(wallet.value?.bankName));
const walletAccountNumber = computed(() =>
  formatWalletAccountDisplay(wallet.value?.accountNumber),
);
const walletAccountName = computed(() => formatWalletAccountDisplay(wallet.value?.accountName));

const { data: walletPayload, pending: loading, refresh: refreshWalletPayload } =
  await useAuthenticatedAsyncData(
    'wallet-page',
    async () => {
      if (!isOwner.value) {
        return {
          wallet: null as WalletRecord | null,
          transactions: [] as WalletTransactionRecord[],
          totalTransactions: 0,
        };
      }

      const nextWallet = await getWallet({ silent: true });
      if (!nextWallet) {
        return {
          wallet: null as WalletRecord | null,
          transactions: [] as WalletTransactionRecord[],
          totalTransactions: 0,
        };
      }

      const response = await listTransactions(
        { page: page.value, limit: limit.value },
        { silent: true },
      );

      return {
        wallet: nextWallet,
        transactions: Array.isArray(response.data?.transactions)
          ? response.data.transactions
          : ([] as WalletTransactionRecord[]),
        totalTransactions: response.data?.totalTransactions ?? 0,
      };
    },
    {
      watch: [page, limit],
      default: () => ({
        wallet: null as WalletRecord | null,
        transactions: [] as WalletTransactionRecord[],
        totalTransactions: 0,
      }),
    },
  );

watch(
  walletPayload,
  (payload) => {
    if (!payload) {
      return;
    }

    wallet.value = payload.wallet ?? null;
    transactions.value = Array.isArray(payload.transactions) ? payload.transactions : [];
    totalTransactions.value = payload.totalTransactions ?? transactions.value.length;

    if (isOwner.value && !loading.value) {
      createDialogOpen.value = !wallet.value;
    }
  },
  { immediate: true },
);

watch(
  () => wallet.value?.balance,
  async (nextBalance, previousBalance) => {
    if (
      !wallet.value ||
      typeof nextBalance !== 'number' ||
      typeof previousBalance !== 'number' ||
      nextBalance === previousBalance
    ) {
      return;
    }

    if (page.value !== 1) {
      setPage(1);
      await nextTick();
    }

    await loadTransactions();
  },
);

let accountPollTimer: ReturnType<typeof setInterval> | null = null;
let accountPollAttempts = 0;
const maxAccountPollAttempts = 6;
const accountPollIntervalMs = 10_000;

function stopAccountPolling() {
  if (accountPollTimer) {
    clearInterval(accountPollTimer);
    accountPollTimer = null;
  }
  accountPollAttempts = 0;
}

async function refreshWalletSilently() {
  if (!wallet.value) {
    return;
  }

  try {
    const next = await getWallet({ silent: true });
    if (next) {
      wallet.value = next;
    }
  } catch {
    // Ignore polling errors; user can refresh manually.
  }
}

function startAccountPolling() {
  if (!import.meta.client || accountPollTimer || !wallet.value) {
    return;
  }

  accountPollTimer = setInterval(async () => {
    accountPollAttempts += 1;
    await refreshWalletSilently();

    if (
      !isWalletVirtualAccountPending(wallet.value) ||
      accountPollAttempts >= maxAccountPollAttempts
    ) {
      stopAccountPolling();
    }
  }, accountPollIntervalMs);
}

function setTransactionTypeFilter(value: typeof transactionTab.value) {
  selectedTransactionIds.value = [];
  if (page.value !== 1) {
    setPage(1);
  }

  router.replace({
    query: {
      ...route.query,
      type: value === 'all' ? undefined : value,
      page: '1',
    },
  });
}

function openTransactionDetails(transaction: WalletTransactionRecord) {
  selectedTransaction.value = transaction;
  transactionDetailOpen.value = true;
}

function closeTransactionDetails() {
  transactionDetailOpen.value = false;
  selectedTransaction.value = null;
}

function onTransactionDetailOpenChange(open: boolean) {
  transactionDetailOpen.value = open;
  if (!open) {
    selectedTransaction.value = null;
  }
}

async function loadTransactions() {
  if (!wallet.value) {
    transactions.value = [];
    totalTransactions.value = 0;
    return;
  }

  transactionsLoading.value = true;
  try {
    const response = await listTransactions({ page: page.value, limit: limit.value });
    transactions.value = response.data?.transactions ?? [];
    totalTransactions.value = response.data?.totalTransactions ?? transactions.value.length;
  } finally {
    transactionsLoading.value = false;
  }
}

async function loadWallet() {
  stopAccountPolling();
  createDialogOpen.value = false;
  try {
    wallet.value = await runWhenSessionReady(() => getWallet());
    if (wallet.value) {
      await loadTransactions();
    } else {
      createDialogOpen.value = true;
    }
  } finally {
    loading.value = false;
  }
}

async function handleCreateWallet(payload: CreateWalletPayload) {
  if (creating.value) {
    return;
  }

  creating.value = true;
  try {
    const response = await createWallet(payload);
    wallet.value = response.data ?? null;
    createDialogOpen.value = false;
    toast.success(extractApiResponseMessage(response, 'Wallet created successfully'));
    if (wallet.value) {
      await loadTransactions();
      if (isWalletVirtualAccountPending(wallet.value)) {
        startAccountPolling();
      }
    }
  } finally {
    creating.value = false;
  }
}

async function copyText(value: string) {
  if (!import.meta.client || !value || !canCopyWalletAccountNumber(wallet.value)) {
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard');
  } catch {
    toast.error('Unable to copy right now');
  }
}

async function refreshWalletData() {
  try {
    await refreshWalletPayload();
  } catch {
    // Errors are surfaced by service when not silent.
  }
}

function hasFundingTransaction(paymentReference: string) {
  const normalizedReference = paymentReference.trim();
  if (!normalizedReference) {
    return false;
  }

  return transactions.value.some((row) => {
    const rowReference = row.reference?.trim?.() ?? '';
    const rowPaymentReference = row.paymentReference?.trim?.() ?? '';
    return rowReference === normalizedReference || rowPaymentReference === normalizedReference;
  });
}

async function ensureFundingTransactionVisible(paymentReference?: string) {
  if (!paymentReference) {
    return;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (hasFundingTransaction(paymentReference)) {
      return;
    }

    await refreshWalletData();

    if (hasFundingTransaction(paymentReference)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
}

async function onFunded(paymentReference?: string) {
  if (page.value !== 1) {
    setPage(1);
    await nextTick();
  }

  await loadWallet();
  await ensureFundingTransactionVisible(paymentReference);
}

function onWalletRefresh() {
  void (async () => {
    await refreshWalletData();
    await loadTransactions();
  })();
}

function onPageChange(nextPage: number) {
  setPage(nextPage);
}

function onPageSizeChange(nextLimit: number) {
  setLimit(nextLimit);
}

watch(
  virtualAccountPending,
  (pending) => {
    if (pending) {
      startAccountPolling();
      return;
    }

    stopAccountPolling();
  },
  { immediate: true },
);

watch(
  session,
  (value) => {
    if (value && !isBusinessOwnerSession(value)) {
      void navigateTo('/market', { replace: true });
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopAccountPolling();
});
</script>

<template>
  <div v-if="!isOwner" class="text-sm text-grey-300">
    Wallet is available to business owners only.
  </div>

  <WalletPageSkeleton v-else-if="loading" :table-row-count="limit" />

  <div v-else-if="!wallet" class="min-h-[240px] w-full" />

  <div v-else data-testid="wallet-page" class="flex w-full flex-col gap-2">
    <section
      class="customer-brand-panel flex flex-wrap items-center justify-between gap-4 rounded-[24px] p-4"
    >
      <div>
        <p class="text-sm text-grey-text">Available balance</p>
        <p class="text-3xl font-semibold text-grey-900">
          {{ formatRequestCurrency(wallet.balance) }}
        </p>
      </div>
      <Button size="medium" class="!w-auto" :left-icon="Plus" @click="fundDialogOpen = true">
        Add money
      </Button>
    </section>

    <section class="w-full rounded-[24px] border border-grey-50 bg-grey-55 p-6">
      <div class="flex w-full flex-col gap-2">
        <p class="text-sm text-grey-300">
          Fund your wallet with your virtual account number
        </p>
        <div class="flex flex-wrap gap-10">
          <div>
            <p class="text-sm font-medium text-grey-900">Bank name</p>
            <p class="text-sm text-grey-300">{{ walletBankName }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-grey-900">Account number</p>
            <div class="flex items-center gap-2">
              <p class="text-sm text-grey-300">{{ walletAccountNumber }}</p>
              <button
                v-if="canCopyAccountNumber"
                type="button"
                class="cursor-pointer text-grey-300 hover:text-grey-900"
                aria-label="Copy account number"
                @click="copyText(walletAccountNumber)"
              >
                <Copy class="size-4" />
              </button>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-grey-900">Account name</p>
            <p class="text-sm text-grey-300">{{ walletAccountName }}</p>
          </div>
        </div>

        <p
          v-if="virtualAccountPending && !virtualAccountPollExhausted"
          class="flex gap-2 text-sm leading-6 text-sky-700"
        >
          <Info class="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden="true" />
          <span>
            Your dedicated account is being assigned. This usually takes a few minutes. You can
            still add money with card while you wait; bank transfer details will appear here when
            ready.
          </span>
        </p>
        <p
          v-else-if="virtualAccountPending && virtualAccountPollExhausted"
          class="flex gap-2 text-sm leading-6 text-amber-800"
        >
          <Info class="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>
            Your account number is still being provisioned. Refresh this page later, or add money
            with card now. In local development, Paystack webhooks must be configured for NUBAN
            assignment to complete.
          </span>
        </p>
      </div>
    </section>

    <div class="flex w-full flex-col gap-2">
      <WalletTransactionsToolbarSkeleton v-if="transactionsLoading" />

      <div
        v-else
        class="flex w-full flex-col gap-2"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
          <button
            v-for="option in transactionTypeOptions"
            :key="option.value"
            type="button"
            :class="[
              'cursor-pointer rounded-full border px-3 py-2 text-sm font-medium transition',
              transactionTab === option.value
                ? 'border-primary-500 bg-primary-500 text-white dark:shadow-none'
                : 'border-border-input-default bg-background-on-canvas text-grey-text hover:border-primary-300',
            ]"
            @click="setTransactionTypeFilter(option.value)"
          >
            {{ option.label }}
          </button>
          </div>

          <ViewToggle
            v-if="!isCompactViewport"
            :model-value="routeView"
            @update:model-value="setView"
          />
        </div>

        <div
          class="flex w-full flex-col gap-2 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between"
        >
          <div class="w-full min-[1000px]:max-w-[300px]">
            <SearchField
              v-model="searchValue"
              placeholder="Search reference number"
              :disabled="transactionsLoading"
            />
          </div>

          <p class="text-sm font-medium text-grey-300 min-[1000px]:text-right">
            {{ visibleTransactionsLabel }}
          </p>
        </div>
      </div>

      <div
        v-if="selectedTransactionIds.length && effectiveView === 'table'"
        class="flex flex-wrap items-center gap-3 rounded-[12px] border border-grey-50 bg-grey-55 px-4 py-3 text-sm text-grey-300"
      >
        <span>{{ selectedTransactionIds.length }} selected</span>
        <span class="text-grey-200">Bulk actions coming soon</span>
      </div>

      <WalletTransactionsTable
        v-if="effectiveView === 'table'"
        :transactions="filteredTransactions"
        :page="transactionMeta.page"
        :total-pages="transactionMeta.totalPages"
        :total-items="transactionMeta.total"
        :page-size="transactionMeta.limit"
        :has-next-page="transactionMeta.hasNextPage"
        :has-prev-page="transactionMeta.hasPrevPage"
        :loading="transactionsLoading"
        @page="onPageChange"
        @page-size="onPageSizeChange"
        @selection-change="selectedTransactionIds = $event"
        @row-click="openTransactionDetails"
      />

      <div v-else class="space-y-2">
        <WalletTransactionCards
          :transactions="filteredTransactions"
          :loading="transactionsLoading"
          @row-click="openTransactionDetails"
        />
        <PaginationBar
          v-if="transactionMeta.total > 0"
          plain
          :page="transactionMeta.page"
          :total-pages="transactionMeta.totalPages"
          :total-items="transactionMeta.total"
          :page-size="transactionMeta.limit"
          :has-next-page="transactionMeta.hasNextPage"
          :has-prev-page="transactionMeta.hasPrevPage"
          :disabled="transactionsLoading"
          @change="onPageChange"
          @page-size-change="onPageSizeChange"
        />
      </div>
    </div>

    <WalletFundDialog
      v-if="businessId"
      :open="fundDialogOpen"
      :wallet="wallet"
      :business-id="businessId"
      @update:open="fundDialogOpen = $event"
      @funded="onFunded"
      @refresh="onWalletRefresh"
    />

    <WalletTransactionDetailDialog
      :open="transactionDetailOpen"
      :transaction="selectedTransaction"
      @update:open="onTransactionDetailOpenChange"
    />
  </div>

  <WalletCreateDialog
    :open="createDialogOpen && !loading && !wallet"
    :loading="creating"
    @create="handleCreateWallet"
    @update:open="createDialogOpen = $event"
  />
</template>
