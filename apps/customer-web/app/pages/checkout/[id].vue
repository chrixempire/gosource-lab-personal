<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import type { ApproveRequestResponse, CustomerMeResponse, RequestRecord } from '@gosource/api-client';
import { Button, StatusTag, toast } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import CheckoutDeliveryDetails from '~/components/checkout/CheckoutDeliveryDetails.vue';
import CheckoutPaymentMethod, {
  type CheckoutPaymentMethodValue,
} from '~/components/checkout/CheckoutPaymentMethod.vue';
import CheckoutPaymentSummary from '~/components/checkout/CheckoutPaymentSummary.vue';
import CheckoutRequestItems from '~/components/checkout/CheckoutRequestItems.vue';
import CheckoutSuccessDialog from '~/components/checkout/CheckoutSuccessDialog.vue';
import CheckoutTransferDialog from '~/components/checkout/CheckoutTransferDialog.vue';
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch';
import { useCustomerListReturn } from '~/composables/useCustomerListReturn';
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
const runWhenSessionReady = useAuthenticatedFetch();
const route = useRoute();
const router = useRouter();
const { navigateToManageRequestsList } = useCustomerListReturn();
const requestId = computed(() => String(route.params.id ?? ''));
const isSuperAdmin = computed(() => isBusinessOwnerSession(session.value));

const { getRequest } = useCustomerRequestService();
const { processPayment, submitting } = useProcessCheckoutPayment();
const { resetCartState, loadCart } = useMarketplaceCart();
const { getWallet } = useCustomerWalletService();
const { getBusinessAccount } = useCustomerProfileService();
const { downloadingInvoice, downloadOrderInvoice } = useDownloadOrderInvoice();
const { getCreditAccount } = useCustomerCreditService();

const loading = ref(true);
const request = ref<RequestRecord | null>(null);
const approvedRequest = ref<RequestRecord | null>(null);
const approvedOrderId = ref<string | null>(null);
const selectedMethod = ref<CheckoutPaymentMethodValue | null>(null);
const transferDialogOpen = ref(false);
const successDialogOpen = ref(false);
const walletBalance = ref<number | null>(null);
const canBuyOnCredit = ref<boolean | null>(null);
const creditAccount = ref<CustomerCreditAccount | null>(null);

const { mutate: paystackMutate } = usePaystack();

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

async function loadCheckoutCreditContext() {
  try {
    const [business, account] = await Promise.all([
      getBusinessAccount(),
      getCreditAccount({ silent: true }),
    ]);
    canBuyOnCredit.value = business?.canBuyOnCredit ?? null;
    creditAccount.value = account;
  } catch {
    canBuyOnCredit.value = null;
    creditAccount.value = null;
  }
}

async function loadWalletBalance() {
  try {
    const wallet = await runWhenSessionReady(() => getWallet());
    walletBalance.value = wallet?.balance ?? 0;
  } catch {
    walletBalance.value = 0;
  }
}

async function fetchCheckoutRequest(options?: { showPageLoading?: boolean }) {
  if (!requestId.value) {
    if (options?.showPageLoading) {
      loading.value = false;
    }
    return;
  }

  if (options?.showPageLoading) {
    loading.value = true;
  }

  try {
    await runWhenSessionReady(async () => {
      if (options?.showPageLoading) {
        await Promise.all([loadWalletBalance(), loadCheckoutCreditContext()]);
      }

      const response = await getRequest(requestId.value);
      const record = response.data ?? null;

      if (!record) {
        toast.error('Unable to find that request.');
        await navigateToManageRequestsList({ replace: true });
        return;
      }

      if (options?.showPageLoading && record.status !== 'pending') {
        toast.error('Only pending requests can be checked out.');
        await navigateTo(`/manage-requests/${record.id}`, { replace: true });
        return;
      }

      request.value = record;
      if (options?.showPageLoading) {
        selectedMethod.value = null;
      }
    });
  } finally {
    if (options?.showPageLoading) {
      loading.value = false;
    }
  }
}

async function loadRequest() {
  await fetchCheckoutRequest({ showPageLoading: true });
}

async function handleCouponApplied() {
  await fetchCheckoutRequest();
}

async function handleCouponRemoved() {
  await fetchCheckoutRequest();
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
  approvedRequest.value = response.data;
  approvedOrderId.value = response.orderId ?? null;
  request.value = response.data;
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

watch(requestId, () => {
  approvedRequest.value = null;
  approvedOrderId.value = null;
  request.value = null;
  selectedMethod.value = null;
  transferDialogOpen.value = false;
  successDialogOpen.value = false;
  void loadRequest();
}, { immediate: true });
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

    <div v-if="loading" class="flex flex-col gap-2">
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
        />

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
      </div>

      <CheckoutRequestItems
        :request="request"
        :format-currency="formatRequestCurrency"
      />

      <div class="grid gap-2 xl:grid-cols-2 xl:items-start">
        <CheckoutDeliveryDetails class="min-w-0" :request="request" />
      </div>
    </div>

    <div
      v-else
      class="rounded-[24px] border border-grey-50 bg-background-on-canvas px-6 py-14 text-center text-sm text-grey-300"
    >
      Request not found.
    </div>

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
