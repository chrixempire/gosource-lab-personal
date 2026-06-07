<script setup lang="ts">
import OrderInvoicePreview from '~/components/orders/OrderInvoicePreview.vue';
import AdminInvoicePreviewShell from '~/components/shared/AdminInvoicePreviewShell.vue';
import type { OrderInvoicePreview as OrderInvoicePreviewData } from '~/types/order-invoice';

const open = defineModel<boolean>('open', { default: false });

defineProps<{
  preview: OrderInvoicePreviewData | null;
}>();
</script>

<template>
  <AdminInvoicePreviewShell v-model:open="open">
    <OrderInvoicePreview v-if="preview" :preview="preview" />
  </AdminInvoicePreviewShell>
</template>
