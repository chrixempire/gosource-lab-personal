<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import CreditActivityLog from '~/components/credit/CreditActivityLog.vue';
import CreditApproveRequestDrawer from '~/components/credit/CreditApproveRequestDrawer.vue';
import CreditBusinessInformation from '~/components/credit/CreditBusinessInformation.vue';
import CreditInternalNotesPanel from '~/components/credit/CreditInternalNotesPanel.vue';
import CreditRepaymentBreakdown from '~/components/credit/CreditRepaymentBreakdown.vue';
import CreditRequestRepaymentSummary from '~/components/credit/CreditRequestRepaymentSummary.vue';
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import CreditRejectDialog from '~/components/credit/CreditRejectDialog.vue';
import CreditRequestDetailHeader from '~/components/credit/CreditRequestDetailHeader.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import LoadingState from '~/components/shared/LoadingState.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useAdminCapabilities } from '~/composables/useAdminCapabilities';
import { useCreditMutations } from '~/composables/useCreditMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import {
  businessDisplayName,
  creditRequestReferenceLabel,
  formatCreditFromKobo,
  parseCreditRequestDetail,
} from '~/lib/credit-api';
import {
  CREDIT_REQUEST_REJECTION_REASON_OPTIONS,
  creditStatusVariant,
  creditWorkflowStatusLabel,
} from '~/lib/credit-constants';

const route = useRoute();
const requestId = computed(() => String(route.params.id ?? ''));
const { updateHeader } = useAdminHeader();
const { canManage, ensureCapabilities } = useAdminCapabilities();
const { busyId, approveCreditRequest, rejectCreditRequest } = useCreditMutations();

onMounted(() => {
  void ensureCapabilities();
});

const rejectOpen = ref(false);
const approveOpen = ref(false);

const { data, pending, error, refresh } = await useFetch<unknown>(
  () => `/api/credit/requests/${requestId.value}`,
  { watch: [requestId] },
);

const credit = computed(() => parseCreditRequestDetail(data.value));
const referenceLabel = computed(() => creditRequestReferenceLabel(requestId.value));
const isPending = computed(() => credit.value?.status === 'pending');
const showRepaymentSchedule = computed(
  () => credit.value?.status === 'approved' || credit.value?.status === 'completed',
);

const businessInfo = computed(() => {
  const row = credit.value;
  if (!row?.business) return null;
  return {
    businessId: String(row.business._id ?? row.business.id ?? ''),
    displayName: businessDisplayName(row.business),
    phoneNumber: row.business.phoneNumber,
    cacRegistrationNumber: row.application?.cacRegistrationNumber,
    tin: row.application?.tin,
    dateJoined: row.business.createdAt,
    dateApplied: row.createdAt,
  };
});

const creditUtilization = computed(() => {
  const account = credit.value?.creditAccount;
  const limit = Number(account?.limitKobo) || 0;
  const outstanding = Number(account?.outstandingKobo) || 0;
  if (!limit) return 0;
  return Math.round((outstanding / limit) * 100);
});

const highCreditRisk = computed(() => creditUtilization.value > 70);

updateHeader({ title: 'Credit requests', goBack: false });

function goBack() {
  void navigateTo(ADMIN_PAGE_ROUTES.CREDIT_REQUESTS);
}

async function onReject(reason: string) {
  try {
    await rejectCreditRequest(requestId.value, reason);
    rejectOpen.value = false;
    await refresh();
  } catch {
    // toast in composable
  }
}

async function onApprove(body: Record<string, unknown>) {
  try {
    await approveCreditRequest(requestId.value, body);
    approveOpen.value = false;
    await refresh();
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <LoadingState v-if="pending && !credit" label="Loading credit request…" />

    <LoadErrorState
      v-else-if="error && !credit"
      :error="error"
      load-failed-title="Unable to load credit request"
      resource-label="credit request"
      @retry="refresh()"
    />

    <template v-else-if="credit">
      <CreditRequestDetailHeader
        :reference-label="referenceLabel"
        :status="credit.status"
        :can-manage="canManage"
        :is-pending="isPending"
        :actions-disabled="busyId === requestId"
        @back="goBack"
        @reject="rejectOpen = true"
        @approve="approveOpen = true"
      />

      <div class="flex flex-col gap-4 md:flex-row md:gap-6">
        <div class="w-full space-y-4 md:max-w-[354px] md:min-w-[300px] md:space-y-6">
          <CreditBusinessInformation v-if="businessInfo" v-bind="businessInfo" />
          <CreditInternalNotesPanel :target-id="requestId" note-type="REQUEST" />
          <CreditActivityLog :timeline="credit.timeline" />
        </div>

        <div class="flex-1 space-y-6">
          <CreditPanelCard title="Credit details">
            <div class="grid grid-cols-2 gap-x-8 gap-y-6">
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide text-grey-500">Requested amount</p>
                <p class="text-sm font-medium text-grey-900">
                  {{ formatCreditFromKobo(credit.requestedAmountKobo) }}
                </p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide text-grey-500">Credit limit</p>
                <p class="text-sm font-medium text-grey-900">
                  {{ formatCreditFromKobo(credit.creditAccount?.limitKobo) }}
                </p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide text-grey-500">Credit utilization</p>
                <p class="text-sm font-medium text-grey-900">{{ creditUtilization }}%</p>
                <StatusTag v-if="highCreditRisk" variant="default" class="text-[0.625rem]">
                  High credit risk
                </StatusTag>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide text-grey-500">Request type</p>
                <p class="text-sm font-medium capitalize text-grey-900">{{ credit.requestType }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs uppercase tracking-wide text-grey-500">Status</p>
                <StatusTag :variant="creditStatusVariant(credit.status)" class="capitalize">
                  {{ creditWorkflowStatusLabel(credit.status) }}
                </StatusTag>
              </div>
            </div>
          </CreditPanelCard>

          <CreditRequestRepaymentSummary v-if="showRepaymentSchedule" :credit="credit" />

          <CreditRepaymentBreakdown
            v-if="showRepaymentSchedule"
            :request-id="requestId"
          />
        </div>
      </div>

      <CreditRejectDialog
        v-model:open="rejectOpen"
        title="Reject credit request"
        description="You're about to reject this credit request. Please provide a reason — the business will be notified and can reapply in the future."
        :reason-options="CREDIT_REQUEST_REJECTION_REASON_OPTIONS"
        :loading="busyId === requestId"
        @confirm="onReject"
      />

      <CreditApproveRequestDrawer
        v-if="credit"
        v-model:open="approveOpen"
        :credit-request="credit"
        :reference-label="referenceLabel"
        :status="credit.status"
        :loading="busyId === requestId"
        @confirm="onApprove"
      />
    </template>
  </div>
</template>
