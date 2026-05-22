<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ArrowLeft } from 'lucide-vue-next';
import PurchaseOrderForm from '~/components/purchase-orders/PurchaseOrderForm.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { usePurchaseOrderMutations } from '~/composables/usePurchaseOrderMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import {
  createEmptyPurchaseOrderFormValues,
  validatePurchaseOrderForm,
} from '~/lib/purchase-order-form';

const { updateHeader } = useAdminHeader();
const { createPurchaseOrder, busyOrderId } = usePurchaseOrderMutations();

const form = reactive(createEmptyPurchaseOrderFormValues());
const fieldErrors = reactive<Record<string, string>>({});
const submitting = computed(() => busyOrderId.value === 'create');

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
    await createPurchaseOrder(form);
    await navigateTo(ADMIN_PAGE_ROUTES.PURCHASE_ORDERS);
  } catch {
    // toast in composable
  }
}

updateHeader({
  title: 'Create purchase order',
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
      <Button type="button" size="small" class="!w-fit" :loading="submitting" @click="onSubmit">
        Create order
      </Button>
    </div>

    <PurchaseOrderForm v-model="form" v-model:field-errors="fieldErrors" mode="create" />
  </div>
</template>
