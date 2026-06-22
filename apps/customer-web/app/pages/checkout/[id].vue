<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import type { ApproveRequestResponse, CustomerMeResponse, RequestRecord } from '@gosource/api-client';
import { Button, StatusTag, toast } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import CheckoutDeliveryMessage from '~/components/checkout/CheckoutDeliveryMessage.vue';
import CheckoutPaymentMethod, {
  type CheckoutPaymentMethodValue,
} from '~/components/checkout/CheckoutPaymentMethod.vue';
import CheckoutPaymentSummary from '~/components/checkout/CheckoutPaymentSummary.vue';
import CheckoutRequestItems from '~/components/checkout/CheckoutRequestItems.vue';
import CheckoutCutoffNoticeDialog from '~/components/checkout/CheckoutCutoffNoticeDialog.vue';
import CheckoutSuccessDialog from '~/components/checkout/CheckoutSuccessDialog.vue';
import CheckoutTransferDialog from '~/components/checkout/CheckoutTransferDialog.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useCustomerListReturn } from '~/composables/useCustomerListReturn';
import { getCustomerSessionCacheSignature } from '~/lib/customer-session-cache';
import { useDownloadOrderInvoice } from '~/composables/useDownloadOrderInvoice';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { usePaystack } from '~/composables/usePaystack';
import { useProcessCheckoutPayment } from '~/composables/useProcessCheckoutPayment';
import { extractPaystackPaymentReference } from '~/lib/wallet-paystack';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import {
  hasCheckoutCouponApplied,
  resolveCheckoutCouponLabel,
} from '~/lib/checkout-coupon';
import { formatRequestCurrency } from '~/lib/request-details';
import { invalidateCheckoutMutationListCaches, invalidateManageRequestsListCache } from '~/lib/invalidate-customer-list-cache';
import {
  resolveBillableDiscount,
  resolveRequestTotalPrice,
} from '~/lib/request-pricing';
import { resolveCheckoutCreditEligibility } from '~/lib/checkout-credit';
import { useCustomerCreditService } from '~/services/credit.service';
import { useCustomerProfileService } from '~/services/profile.service';
import { useCustomerRequestService } from '~/services/request.service';
import { useCustomerWalletService } from '~/services/wallet.service';
import type { CustomerCreditAccount } from '~/types/credit';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const route = useRoute();
const router = useRouter();
const { navigateToManageRequestsList } = useCustomerListReturn();
const requestId = computed(() => String(route.params.id ?? ''));

const { getRequest } = useCustomerRequestService();
const { processPayment, submitting } = useProcessCheckoutPayment();
const { resetCartState, loadCart } = useMarketplaceCart();
const { getWallet } = useCustomerWalletService();
const { getBusinessAccount } = useCustomerProfileService();
const { getCreditAccount } = useCustomerCreditService();
const { downloadingInvoice, downloadOrderInvoice } = useDownloadOrderInvoice();
const approvedRequest = ref<RequestRecord | null>(null);
const approvedOrderId = ref<string | null>(null);
const selectedMethod = ref<CheckoutPaymentMethodValue | null>(null);
const transferDialogOpen = ref(false);
const successDialogOpen = ref(false);
const cutoffNoticeOpen = ref(false);

// Orders placed past the 1pm cutoff are processed the next day. Notify the
// customer once when they land on the checkout page after the cutoff.
const ORDER_CUTOFF_HOUR = 13;

onMounted(() => {
  if (new Date().getHours() >= ORDER_CUTOFF_HOUR) {
    cutoffNoticeOpen.value = true;
  }
});
const walletBalance = ref<number | null>(null);
const canBuyOnCredit = ref<boolean | null>(null);
const creditAccount = ref<CustomerCreditAccount | null>(null);

type CheckoutPagePayload = {
  requestKey: string;
  ready: boolean;
  request: RequestRecord | null;
  walletBalance: number | null;
  canBuyOnCredit: boolean | null;
  creditAccount: CustomerCreditAccount | null;
};

const checkoutKey = computed(
  () =>
    `checkout:${getCustomerSessionCacheSignature(session.value)}:${requestId.value || 'empty'}`,
);

const routeValidatedForRequestId = ref<string | null>(null);

const request = ref<RequestRecord | null>(null);

const { mutate: paystackMutate } = usePaystack();

const {
  data: checkoutPayload,
  pending: checkoutPending,
  refresh: refreshCheckoutPayload,
} = await useAuthenticatedAsyncData(
  checkoutKey,
  async (): Promise<CheckoutPagePayload> => {
    if (!requestId.value) {
      return {
        requestKey: '',
        ready: true,
        request: null,
        walletBalance: null,
        canBuyOnCredit: null,
        creditAccount: null,
      };
    }

    const [requestResponse, wallet, creditContext] = await Promise.all([
      getRequest(requestId.value),
      getWallet().catch(() => null),
      Promise.all([
        getBusinessAccount(),
        getCreditAccount({ silent: true }),
      ]).catch(() => [null, null] as const),
    ]);

    const [business, account] = creditContext;

    return {
      requestKey: requestId.value,
      ready: true,
      request: requestResponse.data ?? null,
      walletBalance: wallet?.balance ?? 0,
      canBuyOnCredit: business?.canBuyOnCredit ?? null,
      creditAccount: account,
    };
  },
  {
    fastNav: true,
    watch: [requestId],
    default: (): CheckoutPagePayload => ({
      requestKey: requestId.value,
      ready: false,
      request: null,
      walletBalance: null,
      canBuyOnCredit: null,
      creditAccount: null,
    }),
  },
);

const showCheckoutSkeleton = computed(
  () => checkoutPending.value && !request.value && !approvedRequest.value,
);

useHead({
  title: computed(() =>
    approvedRequest.value?.reference || request.value?.reference
      ? `${approvedRequest.value?.reference ?? request.value?.reference} · Checkout`
      : 'Checkout',
  ),
});

watch(
  session,
  (value) => {
    if (value && !isBusinessOwnerSession(value)) {
      toast.error('Only business owners can complete checkout.');
      void navigateToManageRequestsList({ replace: true });
    }
  },
  { immediate: true },
);

const requestSubtotal = computed(() => request.value?.subtotal ?? 0);
const requestDeliveryFee = computed(() => request.value?.deliveryFee ?? 0);
const requestDiscount = computed(() =>
  request.value ? resolveBillableDiscount(request.value) : 0,
);
const checkoutCouponApplied = computed(() =>
  request.value ? hasCheckoutCouponApplied(request.value) : false,
);
const checkoutCouponLabel = computed(() => resolveCheckoutCouponLabel(request.value));

const computedServiceCharge = computed(() => {
  if (!request.value) {
    return 0;
  }

  if (selectedMethod.value === 'Credit') {
    return Math.round((requestSubtotal.value + requestDeliveryFee.value) * 0.04);
  }

  return request.value.serviceCharge ?? 0;
});

const computedTotal = computed(() => {
  if (!request.value) {
    return 0;
  }

  return resolveRequestTotalPrice({
    subtotal: requestSubtotal.value,
    deliveryFee: requestDeliveryFee.value,
    serviceCharge: computedServiceCharge.value,
    discount: request.value.discount ?? 0,
    couponDetails: request.value.couponDetails,
  });
});

const checkoutCreditEligibility = computed(() =>
  resolveCheckoutCreditEligibility({
    canBuyOnCredit: canBuyOnCredit.value,
    account: creditAccount.value,
    orderTotalNaira: computedTotal.value,
  }),
);

watch(checkoutCreditEligibility, (eligibility) => {
  if (selectedMethod.value === 'Credit' && !eligibility.enabled) {
    selectedMethod.value = null;
  }
});

watch(
  checkoutPayload,
  async (payload) => {
    if (!payload?.ready || payload.requestKey !== requestId.value) {
      return;
    }

    if (approvedRequest.value || successDialogOpen.value) {
      return;
    }

    if (routeValidatedForRequestId.value !== requestId.value) {
      routeValidatedForRequestId.value = requestId.value;

      if (!payload.request) {
        toast.error('Unable to find that request.');
        await navigateToManageRequestsList({ replace: true });
        return;
      }

      if (payload.request.status !== 'pending') {
        toast.error('Only pending requests can be checked out.');
        await navigateTo(`/manage-requests/${payload.request.id}`, { replace: true });
        return;
      }

      selectedMethod.value = null;
    }

    request.value = payload.request;
    walletBalance.value = payload.walletBalance;
    canBuyOnCredit.value = payload.canBuyOnCredit;
    creditAccount.value = payload.creditAccount;
  },
  { immediate: true },
);

watch(requestId, () => {
  approvedRequest.value = null;
  approvedOrderId.value = null;
  request.value = null;
  selectedMethod.value = null;
  transferDialogOpen.value = false;
  successDialogOpen.value = false;
  routeValidatedForRequestId.value = null;
});

async function refreshCheckoutRequest() {
  await refreshCheckoutPayload();
}

async function handleCouponApplied() {
  await refreshCheckoutRequest();
}

async function handleCouponRemoved() {
  await refreshCheckoutRequest();
}

async function submitCheckout() {
  if (!request.value || !selectedMethod.value || submitting.value) {
    return;
  }

  if (selectedMethod.value === 'Transfer') {
    transferDialogOpen.value = true;
    return;
  }

  if (selectedMethod.value === 'Wallet') {
    if ((walletBalance.value ?? 0) < computedTotal.value) {
      toast.error('Insufficient wallet balance. Choose another payment method.');
      return;
    }
    await processApproval('Wallet');
    return;
  }

  if (selectedMethod.value === 'Credit') {
    if (!checkoutCreditEligibility.value.enabled) {
      toast.error(checkoutCreditEligibility.value.description);
      return;
    }
    await processApproval('Credit');
    return;
  }

  if (selectedMethod.value === 'Paystack') {
    await paystackMutate({
      amount: computedTotal.value,
      metadata: {
        orderId: request.value.id,
        requestId: request.value.id,
        reference: request.value.reference ?? '',
      },
      onSuccess: async (event) => {
        await processApproval('Paystack', {
          paystackCharged: true,
          paystackReference: extractPaystackPaymentReference(event),
        });
      },
    });
    return;
  }

  await processApproval(selectedMethod.value);
}

function applyApprovedCheckout(response: ApproveRequestResponse) {
  const approved = response.data;
  if (!approved) {
    return;
  }

  approvedRequest.value = approved;
  approvedOrderId.value = response.orderId ?? null;
  request.value = approved;
  resetCartState();
  void loadCart(true);
  invalidateCheckoutMutationListCaches();
  successDialogOpen.value = true;
}

async function processApproval(
  method: CheckoutPaymentMethodValue,
  options?: { paystackCharged?: boolean; paystackReference?: string },
) {
  if (!request.value) {
    return;
  }

  const response = await processPayment(request.value.id, method, options);
  if (!response) {
    return;
  }
  transferDialogOpen.value = false;

  if (response?.data) {
    applyApprovedCheckout(response);
  }
}

function openRequestDetails() {
  const targetId = approvedRequest.value?.id ?? request.value?.id;
  if (!targetId) return;
  void navigateTo(`/manage-requests/${targetId}`);
}

function goBackFromCheckout() {
  if (successDialogOpen.value) {
    successDialogOpen.value = false;
  }

  invalidateManageRequestsListCache();

  if (import.meta.client && window.history.length > 1) {
    router.back();
    return;
  }

  void navigateTo('/market');
}

function goBackToRequests() {
  invalidateManageRequestsListCache();
  void navigateToManageRequestsList({ replace: true });
}

function handleSuccessDialogOpenChange(value: boolean) {
  successDialogOpen.value = value;
  if (!value) {
    goBackToRequests();
  }
}

async function downloadApprovedInvoice() {
  if (!approvedOrderId.value) {
    toast.error('Invoice is not available yet.');
    return;
  }

  await downloadOrderInvoice(approvedOrderId.value);
}

function trackApprovedOrder() {
  successDialogOpen.value = false;
  if (approvedOrderId.value) {
    // Replace checkout in history so browser back from order detail does not return here.
    void navigateTo(`/track-orders/${approvedOrderId.value}`, { replace: true });
    return;
  }

  openRequestDetails();
}

const checkoutCtaLabel = computed(() => {
  if (selectedMethod.value === 'Paystack') {
    return 'Proceed to payment';
  }
  if (selectedMethod.value === 'Transfer') {
    return 'Continue with transfer';
  }
  if (selectedMethod.value === 'Wallet') {
    return 'Pay with wallet';
  }
  if (selectedMethod.value === 'Credit') {
    return 'Pay with credit';
  }
  return 'Complete checkout';
});

const canSubmitCheckout = computed(
  () => Boolean(request.value) && Boolean(selectedMethod.value) && !submitting.value,
);
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <div class="flex items-center justify-between gap-3">
      <Button
        variant="neutral"
        size="small"
        class="!w-auto"
        :left-icon="ChevronLeft"
        @click="goBackFromCheckout"
      >
        Back
      </Button>

      <StatusTag
        v-if="request && !approvedRequest"
        :variant="'warning'"
        size="medium"
        class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
      >
        Pending checkout
      </StatusTag>
    </div>

    <div v-if="showCheckoutSkeleton" class="flex flex-col gap-2">
      <div class="grid gap-2 xl:grid-cols-2 xl:items-start">
        <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
          <div class="h-6 w-40 animate-pulse rounded bg-grey-50" />
          <div class="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-grey-50" />
          <div class="mt-5 grid gap-3">
            <div
              v-for="index in 4"
              :key="`payment-${index}`"
              class="rounded-[18px] border border-grey-50 p-4"
            >
              <div class="h-5 w-32 animate-pulse rounded bg-grey-50" />
              <div class="mt-2 h-4 w-full animate-pulse rounded bg-grey-50" />
            </div>
          </div>
        </section>

        <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
          <div class="h-6 w-36 animate-pulse rounded bg-grey-50" />
          <div class="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-grey-50" />
          <div class="mt-2 space-y-2">
            <div
              v-for="index in 4"
              :key="`summary-${index}`"
              class="h-4 animate-pulse rounded bg-grey-50"
            />
          </div>
          <div class="mt-6 h-11 w-full animate-pulse rounded-[16px] bg-grey-50" />
        </section>
      </div>

      <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
        <div class="h-6 w-36 animate-pulse rounded bg-grey-50" />
        <div class="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-grey-50" />
        <div class="mt-5 h-32 animate-pulse rounded-[18px] bg-grey-55" />
      </section>

      <div class="grid gap-2 xl:grid-cols-2 xl:items-start">
        <section class="min-w-0 rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
          <div class="h-6 w-40 animate-pulse rounded bg-grey-50" />
          <div class="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-grey-50" />
          <div class="mt-5 grid gap-4 min-[560px]:grid-cols-2">
            <div
              v-for="index in 4"
              :key="`delivery-${index}`"
              class="rounded-[18px] bg-grey-55 px-4 py-4"
            >
              <div class="h-3 w-20 animate-pulse rounded bg-grey-50" />
              <div class="mt-3 h-4 w-40 max-w-full animate-pulse rounded bg-grey-50" />
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-else-if="request" class="flex flex-col gap-2">
      <div class="grid gap-2 xl:grid-cols-2 xl:items-start">
        <CheckoutPaymentMethod
          v-model="selectedMethod"
          :order-total="computedTotal"
          :wallet-balance="walletBalance"
          :credit-enabled="checkoutCreditEligibility.enabled"
          :credit-available-kobo="creditAccount?.availableKobo ?? 0"
          :credit-description="checkoutCreditEligibility.description"
          :request="request"
        />

        <div class="flex flex-col gap-2">
          <CheckoutPaymentSummary
            :request-id="request.id"
            :subtotal="requestSubtotal"
            :delivery-fee="requestDeliveryFee"
            :service-charge="computedServiceCharge"
            :discount="requestDiscount"
            :total="computedTotal"
            :format-currency="formatRequestCurrency"
            :coupon-applied="checkoutCouponApplied"
            :coupon-label="checkoutCouponLabel"
            :submitting="submitting"
            :can-submit="canSubmitCheckout"
            :submit-label="checkoutCtaLabel"
            @submit="submitCheckout"
            @coupon-applied="handleCouponApplied"
            @coupon-removed="handleCouponRemoved"
          />

          <CheckoutDeliveryMessage />
        </div>
      </div>

      <CheckoutRequestItems
        :request="request"
        :format-currency="formatRequestCurrency"
      />
    </div>

    <div
      v-else
      class="rounded-[24px] border border-grey-50 bg-background-on-canvas px-6 py-14 text-center text-sm text-grey-300"
    >
      Request not found.
    </div>

    <CheckoutCutoffNoticeDialog
      :open="cutoffNoticeOpen"
      @update:open="cutoffNoticeOpen = $event"
    />

    <CheckoutTransferDialog
      :open="transferDialogOpen"
      :loading="submitting"
      @update:open="transferDialogOpen = $event"
      @confirm="processApproval('Transfer')"
    />

    <CheckoutSuccessDialog
      :open="successDialogOpen"
      :reference="approvedRequest?.reference ?? request?.reference ?? ''"
      :download-invoice-loading="downloadingInvoice"
      @update:open="handleSuccessDialogOpenChange"
      @download-invoice="downloadApprovedInvoice"
      @track-order="trackApprovedOrder"
    />
  </div>
</template>
