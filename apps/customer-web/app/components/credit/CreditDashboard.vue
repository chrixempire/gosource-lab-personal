<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Check, ChevronDown } from 'lucide-vue-next';
import CreditAccountOverview from '~/components/credit/CreditAccountOverview.vue';
import CreditCancelRequestDialog from '~/components/credit/CreditCancelRequestDialog.vue';
import CreditGetCreditDialog from '~/components/credit/CreditGetCreditDialog.vue';
import CreditHistorySection from '~/components/credit/CreditHistorySection.vue';
import CreditMakeRepaymentDialog from '~/components/credit/CreditMakeRepaymentDialog.vue';
import CreditManageLimitDialog from '~/components/credit/CreditManageLimitDialog.vue';
import CreditUpcomingBanner from '~/components/credit/CreditUpcomingBanner.vue';
import type {
  CustomerCreditAccount,
  CustomerCreditApplication,
  CustomerCreditRepayment,
  CustomerCreditRequest,
  CustomerUpcomingCreditPayment,
  CreditListMeta,
  CreditRequestType,
} from '~/types/credit';

const props = defineProps<{
  account: CustomerCreditAccount | null;
  lastInitialApplication: CustomerCreditApplication | null;
  lastIncreaseApplication: CustomerCreditApplication | null;
  creditRequests: CustomerCreditRequest[];
  repayments: CustomerCreditRepayment[];
  creditMeta: CreditListMeta;
  repaymentMeta: CreditListMeta;
  upcomingPayment: CustomerUpcomingCreditPayment;
  isOwner: boolean;
  creditLoading?: boolean;
  repaymentLoading?: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  creditPage: [page: number];
  creditLimit: [limit: number];
  repaymentPage: [page: number];
  repaymentLimit: [limit: number];
}>();

const getCreditOpen = ref(false);
const repaymentOpen = ref(false);
const manageLimitOpen = ref(false);
const cancelOpen = ref(false);
const getCreditType = ref<CreditRequestType>('initial');
const reapplyRequest = ref<CustomerCreditRequest | null>(null);
const cancelTarget = ref<CustomerCreditRequest | null>(null);

const hasPendingApplication = computed(
  () =>
    props.lastInitialApplication?.status === 'pending' ||
    props.lastIncreaseApplication?.status === 'pending',
);

const showRejectedNotice = computed(
  () => props.lastInitialApplication?.status === 'rejected' && !props.account,
);

const hasPendingRequest = computed(() =>
  props.creditRequests.some((item) => item.status === 'pending'),
);

const showMakeRepayment = computed(() => (props.account?.outstandingKobo ?? 0) > 0);

/** Match gosource-web-app: disable primary actions while under review or not eligible. */
const isGetCreditDisabled = computed(
  () =>
    hasPendingApplication.value ||
    props.lastInitialApplication?.status !== 'approved' ||
    hasPendingRequest.value ||
    showMakeRepayment.value,
);

const isMoreActionsDisabled = computed(
  () => hasPendingApplication.value || !props.account,
);

/** When true, owner header actions must not be interactive (matches review banner). */
const lockOwnerCreditActions = computed(() => hasPendingApplication.value);

const disableManageCreditLimit = computed(() => {
  const creditUtil = props.account?.creditUtilization ?? 0;
  return (
    (props.account?.totalOverdueKobo ?? 0) > 0 ||
    props.lastIncreaseApplication?.status === 'pending' ||
    creditUtil > 50
  );
});

function openGetCredit(type: CreditRequestType, request?: CustomerCreditRequest) {
  if (isGetCreditDisabled.value && type === 'initial' && !request) {
    return;
  }

  getCreditType.value = type;
  reapplyRequest.value = request ?? null;
  getCreditOpen.value = true;
}

function openCancel(request: CustomerCreditRequest) {
  cancelTarget.value = request;
  cancelOpen.value = true;
}

function onActionSuccess() {
  emit('refresh');
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="hasPendingApplication"
      role="status"
      class="flex items-center justify-center gap-2 rounded-lg bg-[#DD900D] px-4 py-2 text-sm text-white"
    >
      <Check class="size-4 shrink-0" aria-hidden="true" />
      <p>Your application is being reviewed. You'll be notified once it is approved.</p>
    </div>

    <div
      class="flex flex-wrap items-start justify-between gap-4 border-b border-grey-50 pb-4"
    >
      <div class="min-w-0">
        <h2 class="text-xl font-medium text-grey-900">Credit</h2>
        <p class="mt-1 text-sm text-grey-400">
          Access credit, manage your limits, and grow your business.
        </p>
      </div>

      <p v-if="!isOwner" class="text-sm text-grey-400">
        Credit actions are available to the business owner only.
      </p>

      <div
        v-else
        class="flex flex-wrap items-center gap-2"
        :class="{ 'cursor-not-allowed': lockOwnerCreditActions }"
      >
        <Button
          v-if="showMakeRepayment"
          type="button"
          size="small"
          class="!w-auto shrink-0"
          :disabled="
            lockOwnerCreditActions ||
            !upcomingPayment ||
            upcomingPayment.totalNextPaymentKobo <= 0
          "
          @click="repaymentOpen = true"
        >
          Make repayment
        </Button>
        <Button
          v-else
          type="button"
          size="small"
          class="!w-auto shrink-0"
          :disabled="isGetCreditDisabled"
          @click="openGetCredit('initial')"
        >
          Get credit
        </Button>

        <template v-if="isMoreActionsDisabled">
          <Button
            type="button"
            variant="outline"
            size="small"
            class="!w-auto shrink-0"
            :disabled="true"
            :aria-disabled="true"
            :right-icon="ChevronDown"
          >
            More actions
          </Button>
        </template>
        <DropdownMenu v-else>
            <DropdownMenuTrigger as-child>
              <Button
                type="button"
                variant="outline"
                size="small"
                class="!w-auto shrink-0"
                :right-icon="ChevronDown"
              >
                More actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                :disabled="!account || hasPendingRequest"
                @select="openGetCredit('topup')"
              >
                Top up credit
              </DropdownMenuItem>
              <DropdownMenuItem
                :disabled="disableManageCreditLimit"
                @select="manageLimitOpen = true"
              >
                Manage credit limit
              </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <CreditUpcomingBanner :upcoming="upcomingPayment" />

    <CreditAccountOverview :account="account" />

    <div
      v-if="showRejectedNotice"
      class="rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-grey-700"
    >
      <p class="font-medium text-grey-900">Application not approved</p>
      <p class="mt-1">
        {{
          lastInitialApplication?.rejectionReason ||
          'Your last credit application was rejected. You can reapply after 60 days.'
        }}
      </p>
      <Button
        v-if="isOwner"
        class="mt-3 !w-auto shrink-0"
        size="small"
        variant="outline"
        @click="openGetCredit('initial')"
      >
        Apply again
      </Button>
    </div>

    <CreditHistorySection
      v-else
      :credit-requests="creditRequests"
      :repayments="repayments"
      :credit-meta="creditMeta"
      :repayment-meta="repaymentMeta"
      :credit-loading="creditLoading"
      :repayment-loading="repaymentLoading"
      :is-owner="isOwner"
      @credit-page="emit('creditPage', $event)"
      @credit-limit="emit('creditLimit', $event)"
      @repayment-page="emit('repaymentPage', $event)"
      @repayment-limit="emit('repaymentLimit', $event)"
      @cancel-request="openCancel"
      @reapply="(row) => openGetCredit(row.requestType, row)"
    />

    <CreditGetCreditDialog
      v-model:open="getCreditOpen"
      :request-type="getCreditType"
      :account="account"
      :reapply-request="reapplyRequest"
      @success="onActionSuccess"
    />
    <CreditMakeRepaymentDialog
      v-model:open="repaymentOpen"
      :upcoming="upcomingPayment"
      :account="account"
      @success="onActionSuccess"
    />
    <CreditManageLimitDialog v-model:open="manageLimitOpen" @success="onActionSuccess" />
    <CreditCancelRequestDialog
      v-model:open="cancelOpen"
      :request="cancelTarget"
      @success="onActionSuccess"
    />
  </div>
</template>
