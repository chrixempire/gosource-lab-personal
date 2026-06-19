<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ArrowLeft } from 'lucide-vue-next';
import PurchaseOrderForm from '~/components/purchase-orders/PurchaseOrderForm.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { usePurchaseOrderMutations } from '~/composables/usePurchaseOrderMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import {
  billToFromLegacySuppliers,
  creatorOrderedByLabel,
  parsePurchaseOrderDetail,
} from '~/lib/purchase-order-api';
import {
  enrichPurchaseOrderLineItemCategories,
  mapPurchaseOrderToFormValues,
  validatePurchaseOrderForm,
} from '~/lib/purchase-order-form';

const route = useRoute();
const orderId = computed(() => String(route.params.id ?? ''));

const { updateHeader } = useAdminHeader();
const { updatePurchaseOrder, busyOrderId } = usePurchaseOrderMutations();

const form = reactive(mapPurchaseOrderToFormValues({}));
const fieldErrors = reactive<Record<string, string>>({});
const submitting = computed(() => busyOrderId.value === orderId.value);
const initialBillToById = ref<Record<string, { name: string; email: string }>>({});
const initialOrderedByLabel = ref('');
const loadingCategories = ref(false);
const formHydrating = computed(() => pending.value || loadingCategories.value);

const { data, pending, error, refresh } = useAdminAuthenticatedFetch<unknown>(
  () => `/api/purchase-orders/${orderId.value}`,
  {
    watch: [orderId],
    key: computed(() => `admin-purchase-order-detail:${orderId.value}`),
  },
);

watch(
  data,
  async (payload) => {
    const detail = parsePurchaseOrderDetail(payload);
    if (!detail) {
      return;
    }

    loadingCategories.value = true;
    try {
      const values = mapPurchaseOrderToFormValues(detail);
      await enrichPurchaseOrderLineItemCategories(values.lineItems);
      Object.assign(form, values);
      const billTo = billToFromLegacySuppliers(detail.suppliers);
      initialBillToById.value = Object.fromEntries(
        (detail.suppliers ?? []).map((supplier, index) => {
          const id = String(supplier._id ?? supplier.id ?? '');
          return [id, billTo[index] ?? { name: '—', email: '—' }];
        }),
      );
      initialOrderedByLabel.value = creatorOrderedByLabel(detail.creator);
    } finally {
      loadingCategories.value = false;
    }
  },
  { immediate: true },
);

function goBack() {
  void navigateTo(ADMIN_PAGE_ROUTES.PURCHASE_ORDERS);
}

async function onSubmit() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  Object.assign(fieldErrors, validatePurchaseOrderForm(form));

  if (Object.keys(fieldErrors).length > 0) {
    return;
  }

  try {
    await updatePurchaseOrder(orderId.value, form);
    await refresh();
    await navigateTo(ADMIN_PAGE_ROUTES.PURCHASE_ORDERS);
  } catch {
    // toast in composable
  }
}

updateHeader({
  title: 'Edit purchase order',
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Button
        type="button"
        variant="ghost"
        size="small"
        class="!w-fit"
        :left-icon="ArrowLeft"
        @click="goBack"
      >
        Back
      </Button>
      <Button
        type="button"
        size="small"
        class="!w-fit"
        :loading="submitting"
        :disabled="formHydrating"
        @click="onSubmit"
      >
        Save changes
      </Button>
    </div>

    <LoadErrorState
      v-if="!pending && error"
      :error="error"
      not-found-title="Purchase order not found"
      resource-label="purchase order"
      @retry="refresh()"
    />
    <PurchaseOrderForm
      v-else-if="!error"
      v-model="form"
      v-model:field-errors="fieldErrors"
      mode="edit"
      :order-id="orderId"
      :hydrating="formHydrating"
      :initial-bill-to-by-id="initialBillToById"
      :initial-ordered-by-label="initialOrderedByLabel"
    />
  </div>
</template>
