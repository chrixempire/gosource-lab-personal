<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import type { CustomerMeResponse, RequestRecord } from '@gosource/api-client';
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
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { usePaystack } from '~/composables/usePaystack';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { formatRequestCurrency } from '~/lib/request-details';
import { useCustomerOrderService } from '~/services/order.service';
import { useCustomerRequestService } from '~/services/request.service';
import { useCustomerWalletService } from '~/services/wallet.service';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const runWhenSessionReady = useAuthenticatedFetch();
const route = useRoute();
const requestId = computed(() => String(route.params.id ?? ''));
const isSuperAdmin = computed(() => isBusinessOwnerSession(session.value));

const { getRequest, approveRequest } = useCustomerRequestService();
const { resetCartState, loadCart } = useMarketplaceCart();
const { getWallet } = useCustomerWalletService();
const { getOrderInvoiceUrl } = useCustomerOrderService();

const loading = ref(true);
const submitting = ref(false);
const request = ref<RequestRecord | null>(null);
const approvedRequest = ref<RequestRecord | null>(null);
const approvedOrderId = ref<string | null>(null);
const selectedMethod = ref<CheckoutPaymentMethodValue | null>(null);
const transferDialogOpen = ref(false);
const successDialogOpen = ref(false);
const downloadingInvoice = ref(false);
const walletBalance = ref<number | null>(null);

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
      void navigateTo('/manage-requests', { replace: true });
    }
  },
  { immediate: true },
);

const requestSubtotal = computed(() => request.value?.subtotal ?? 0);
const requestDeliveryFee = computed(() => request.value?.deliveryFee ?? 0);
const requestDiscount = computed(() => request.value?.discount ?? 0);

const computedServiceCharge = computed(() => {
  if (!request.value) {
    return 0;
  }

  if (selectedMethod.value === 'Credit') {
    return Math.round((requestSubtotal.value + requestDeliveryFee.value) * 0.04);
  }

  return request.value.serviceCharge ?? 0;
});

const computedTotal = computed(
  () =>
    requestSubtotal.value +
    requestDeliveryFee.value +
    computedServiceCharge.value -
    requestDiscount.value,
);

async function loadWalletBalance() {
  try {
    const wallet = await runWhenSessionReady(() => getWallet());
    walletBalance.value = wallet?.balance ?? 0;
  } catch {
    walletBalance.value = 0;
  }
}

async function loadRequest() {
  if (!requestId.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    await runWhenSessionReady(async () => {
      await loadWalletBalance();
      const response = await getRequest(requestId.value);
      const record = response.data ?? null;

      if (!record) {
        toast.error('Unable to find that request.');
        await navigateTo('/manage-requests', { replace: true });
        return;
      }

      if (record.status !== 'pending') {
        toast.error('Only pending requests can be checked out.');
        await navigateTo(`/manage-requests/${record.id}`, { replace: true });
        return;
      }

      request.value = record;
      selectedMethod.value = null;
    });
  } finally {
    loading.value = false;
  }
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

  if (selectedMethod.value === 'Paystack') {
    await paystackMutate({
      amount: computedTotal.value,
      metadata: {
        orderId: request.value.id,
        requestId: request.value.id,
        reference: request.value.reference ?? '',
      },
      onSuccess: async () => {
        await processApproval('Paystack');
      },
    });
    return;
  }

  await processApproval(selectedMethod.value);
}

async function processApproval(method: CheckoutPaymentMethodValue) {
  if (!request.value || submitting.value) {
    return;
  }

  submitting.value = true;
  try {
    const response = await approveRequest(request.value.id, {
      paymentMethod: method,
    });

    if (response.data) {
      approvedRequest.value = response.data;
      approvedOrderId.value = response.orderId ?? null;
      request.value = response.data;
      resetCartState();
      await loadCart(true);
      successDialogOpen.value = true;
      toast.success('Payment successful!');
    }
  } finally {
    submitting.value = false;
    transferDialogOpen.value = false;
  }
}

function openRequestDetails() {
  const targetId = approvedRequest.value?.id ?? request.value?.id;
  if (!targetId) return;
  void navigateTo(`/manage-requests/${targetId}`);
}

function goBackToRequests() {
  successDialogOpen.value = false;
  void navigateTo('/manage-requests');
}

async function downloadApprovedInvoice() {
  if (!approvedOrderId.value) {
    toast.error('Invoice is not available yet.');
    return;
  }

  if (downloadingInvoice.value) {
    return;
  }

  downloadingInvoice.value = true;

  try {
    const response = await fetch(getOrderInvoiceUrl(approvedOrderId.value), {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Invoice download failed');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `order_invoice_${approvedRequest.value?.reference ?? approvedOrderId.value}.pdf`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    toast.error('Unable to download invoice right now.');
  } finally {
    downloadingInvoice.value = false;
  }
}

function trackApprovedOrder() {
  successDialogOpen.value = false;
  if (approvedOrderId.value) {
    void navigateTo(`/track-orders/${approvedOrderId.value}`);
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
  <div class="flex w-full flex-col gap-6">
    <div class="flex items-center justify-between gap-3">
      <Button
        variant="neutral"
        size="small"
        class="!w-auto"
        :left-icon="ChevronLeft"
        @click="approvedRequest ? goBackToRequests() : navigateTo(`/manage-requests/${requestId}`)"
      >
        {{ approvedRequest ? 'Back to requests' : 'Back to request' }}
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

    <div v-if="loading" class="flex flex-col gap-6">
      <div class="grid gap-6 xl:grid-cols-2 xl:items-start">
        <section class="rounded-[24px] border border-grey-50 bg-white p-5">
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

        <section class="rounded-[24px] border border-grey-50 bg-white p-5">
          <div class="h-6 w-36 animate-pulse rounded bg-grey-50" />
          <div class="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-grey-50" />
          <div class="mt-5 space-y-3">
            <div
              v-for="index in 4"
              :key="`summary-${index}`"
              class="h-4 animate-pulse rounded bg-grey-50"
            />
          </div>
          <div class="mt-6 h-11 w-full animate-pulse rounded-[16px] bg-grey-50" />
        </section>
      </div>

      <section class="rounded-[24px] border border-grey-50 bg-white p-5">
        <div class="h-6 w-36 animate-pulse rounded bg-grey-50" />
        <div class="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-grey-50" />
        <div class="mt-5 h-32 animate-pulse rounded-[18px] bg-grey-55" />
      </section>

      <div class="grid gap-6 xl:grid-cols-2 xl:items-start">
        <section class="min-w-0 rounded-[24px] border border-grey-50 bg-white p-5">
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

    <div v-else-if="request" class="flex flex-col gap-6">
      <div class="grid gap-6 xl:grid-cols-2 xl:items-start">
        <CheckoutPaymentMethod
          v-model="selectedMethod"
          :order-total="computedTotal"
          :wallet-balance="walletBalance"
        />

        <CheckoutPaymentSummary
          :subtotal="requestSubtotal"
          :delivery-fee="requestDeliveryFee"
          :service-charge="computedServiceCharge"
          :discount="requestDiscount"
          :total="computedTotal"
          :format-currency="formatRequestCurrency"
          :submitting="submitting"
          :can-submit="canSubmitCheckout"
          :submit-label="checkoutCtaLabel"
          @submit="submitCheckout"
        />
      </div>

      <CheckoutRequestItems
        :request="request"
        :format-currency="formatRequestCurrency"
      />

      <div class="grid gap-6 xl:grid-cols-2 xl:items-start">
        <CheckoutDeliveryDetails class="min-w-0" :request="request" />
      </div>
    </div>

    <div
      v-else
      class="rounded-[24px] border border-grey-50 bg-white px-6 py-14 text-center text-sm text-grey-300"
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
      @update:open="successDialogOpen = $event"
      @close="goBackToRequests"
      @download-invoice="downloadApprovedInvoice"
      @track-order="trackApprovedOrder"
    />
  </div>
</template>
