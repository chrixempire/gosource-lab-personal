<script setup lang="ts">
import CreditActivityLog from '~/components/credit/CreditActivityLog.vue';
import CreditAdditionalDocuments from '~/components/credit/CreditAdditionalDocuments.vue';
import CreditApplicationDetailHeader from '~/components/credit/CreditApplicationDetailHeader.vue';
import CreditApplicationLimitDetails from '~/components/credit/CreditApplicationLimitDetails.vue';
import CreditApproveApplicationDialog from '~/components/credit/CreditApproveApplicationDialog.vue';
import CreditBusinessActivitySummary from '~/components/credit/CreditBusinessActivitySummary.vue';
import CreditBusinessInformation from '~/components/credit/CreditBusinessInformation.vue';
import CreditFinancialSnapshots from '~/components/credit/CreditFinancialSnapshots.vue';
import CreditInternalNotesPanel from '~/components/credit/CreditInternalNotesPanel.vue';
import CreditKycDocuments from '~/components/credit/CreditKycDocuments.vue';
import CreditChangeApplicationStatusDialog from '~/components/credit/CreditChangeApplicationStatusDialog.vue';
import CreditRequestMoreInfoDialog from '~/components/credit/CreditRequestMoreInfoDialog.vue';
import CreditReviewChecklist from '~/components/credit/CreditReviewChecklist.vue';
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import CreditRejectDialog from '~/components/credit/CreditRejectDialog.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import LoadingState from '~/components/shared/LoadingState.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useAdminCapabilities } from '~/composables/useAdminCapabilities';
import { useCreditMutations } from '~/composables/useCreditMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import {
  businessDisplayName,
  creditApplicationReferenceLabel,
  formatCreditFromKobo,
  parseCreditApplicationDetail,
} from '~/lib/credit-api';
import {
  CREDIT_APPLICATION_REJECTION_REASON_OPTIONS,
} from '~/lib/credit-constants';

const route = useRoute();
const applicationId = computed(() => String(route.params.id ?? ''));
const runtimeConfig = useRuntimeConfig();
const { updateHeader } = useAdminHeader();
const { canManage, ensureCapabilities } = useAdminCapabilities();
const { busyId, approveApplication, rejectApplication, reopenApplication } = useCreditMutations();

onMounted(() => {
  void ensureCapabilities();
});

const approveOpen = ref(false);
const rejectOpen = ref(false);
const reopenOpen = ref(false);
const moreInfoOpen = ref(false);

const { data, pending, error, refresh } = await useAdminAuthenticatedFetch<unknown>(
  () => `/api/credit/applications/${applicationId.value}`,
  {
    watch: [applicationId],
    key: computed(() => `admin-credit-application-detail:${applicationId.value}`),
  },
);

const credit = computed(() =>
  parseCreditApplicationDetail(data.value, runtimeConfig.public.creditDocumentCdnBaseUrl),
);
const referenceLabel = computed(() => creditApplicationReferenceLabel(applicationId.value));
const isPending = computed(() => credit.value?.status === 'pending');
const isRejected = computed(() => credit.value?.status === 'rejected');
const isInitialApplication = computed(() => credit.value?.applicationType === 'initial');
const isIncreaseApplication = computed(() => credit.value?.applicationType === 'increase');
const additionalDocs = computed(() => credit.value?.additionalDocs ?? []);

const businessInfo = computed(() => {
  const row = credit.value;
  if (!row?.business) return null;
  return {
    businessId: String(row.business._id ?? row.business.id ?? ''),
    displayName: businessDisplayName(row.business),
    phoneNumber: row.business.phoneNumber,
    cacRegistrationNumber: row.cacRegistrationNumber,
    tin: row.tin,
    dateJoined: row.business.createdAt,
    dateApplied: row.createdAt,
  };
});

updateHeader({ title: 'Applications', goBack: false });

useHead({
  title: computed(() =>
    credit.value ? `${referenceLabel.value} · Applications` : 'Credit application',
  ),
});

function goBack() {
  void navigateTo(ADMIN_PAGE_ROUTES.CREDIT_APPLICATIONS);
}

async function onApprove(amount: number) {
  try {
    await approveApplication(applicationId.value, amount);
    approveOpen.value = false;
    await refresh();
  } catch {
    // toast in composable
  }
}

async function onReject(reason: string) {
  try {
    await rejectApplication(applicationId.value, reason);
    rejectOpen.value = false;
    await refresh();
  } catch {
    // toast in composable
  }
}

async function onReopen(reason: string) {
  try {
    await reopenApplication(applicationId.value, reason);
    reopenOpen.value = false;
    await refresh();
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <LoadingState v-if="pending && !credit" label="Loading application…" />

    <LoadErrorState
      v-else-if="error && !credit"
      :error="error"
      load-failed-title="Unable to load application"
      resource-label="credit application"
      @retry="refresh()"
    />

    <LoadErrorState
      v-else-if="!pending && !credit"
      load-failed-title="Unable to load application"
      resource-label="credit application"
      description="We received a response but could not read this application. Try again or open it from the applications list."
      @retry="refresh()"
    />

    <template v-else-if="credit">
      <div class="flex min-w-0 flex-col gap-3">
        <CreditApplicationDetailHeader
          :reference-label="referenceLabel"
          :status="credit.status"
          :loading="pending"
          :can-manage="canManage"
          :is-pending="isPending"
          :is-rejected="isRejected"
          :actions-disabled="busyId === applicationId"
          @back="goBack"
          @approve="approveOpen = true"
          @reject="rejectOpen = true"
          @request-more-info="moreInfoOpen = true"
          @reopen="reopenOpen = true"
        />

        <div class="flex flex-col gap-4 md:flex-row md:gap-6">
          <div class="w-full space-y-4 md:max-w-[354px] md:space-y-6">
            <CreditBusinessInformation
              v-if="businessInfo"
              v-bind="businessInfo"
            />
            <CreditReviewChecklist
              v-if="isInitialApplication"
              :application-id="applicationId"
              :business-id="businessInfo?.businessId"
              :editable="isPending && canManage"
            />
            <CreditInternalNotesPanel
              :target-id="applicationId"
              note-type="APPLICATION"
            />
            <CreditPanelCard
              v-if="credit.rejectionReason"
              title="Rejection"
            >
              <p class="text-sm text-grey-700">{{ credit.rejectionReason }}</p>
            </CreditPanelCard>
            <CreditActivityLog :timeline="credit.timeline" />
          </div>

          <div class="flex-1 space-y-4 md:space-y-6">
            <CreditApplicationLimitDetails
              v-if="isIncreaseApplication"
              :credit="credit"
            />

            <CreditPanelCard
              v-else
              title="Credit request details"
            >
              <div class="flex flex-wrap gap-6">
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide text-grey-500">Requested amount</p>
                  <p class="text-sm font-medium text-grey-900">
                    {{ formatCreditFromKobo(credit.requestedAmountKobo) }}
                  </p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide text-grey-500">Approved amount</p>
                  <p class="text-sm font-medium text-grey-900">
                    {{ formatCreditFromKobo(credit.approvedAmountKobo) }}
                  </p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs uppercase tracking-wide text-grey-500">Application type</p>
                  <p class="text-sm font-medium text-grey-900 capitalize">
                    {{ credit.applicationType }}
                  </p>
                </div>
              </div>
            </CreditPanelCard>

            <CreditBusinessActivitySummary
              v-if="isInitialApplication && businessInfo?.businessId"
              :business-id="businessInfo.businessId"
              :credit-status="credit.status"
            />

            <CreditFinancialSnapshots
              v-if="isInitialApplication"
              :revenue-range="credit.revenueRange"
              :year-of-operations="credit.yearOfOperations"
              :bank-statement-url="credit.bankStatement"
            />

            <CreditKycDocuments
              v-if="isInitialApplication"
              :bvn="credit.bvn"
              :identity-type="credit.identityType"
              :identity-url="credit.identity"
            />

            <CreditAdditionalDocuments
              :application-id="applicationId"
              :documents="additionalDocs"
              :editable="isPending && canManage"
              @refreshed="refresh()"
            />
          </div>
        </div>
      </div>

      <CreditRequestMoreInfoDialog v-model:open="moreInfoOpen" />

      <CreditApproveApplicationDialog
        v-model:open="approveOpen"
        :loading="busyId === applicationId"
        @confirm="onApprove"
      />
      <CreditRejectDialog
        v-model:open="rejectOpen"
        title="Reject application"
        description="This credit application would be rejected and the business would not be able to request for credit."
        :reason-options="CREDIT_APPLICATION_REJECTION_REASON_OPTIONS"
        :loading="busyId === applicationId"
        @confirm="onReject"
      />

      <CreditChangeApplicationStatusDialog
        v-model:open="reopenOpen"
        :loading="busyId === applicationId"
        @confirm="onReopen"
      />
    </template>
  </div>
</template>
