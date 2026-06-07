<script setup lang="ts">
import PurchaseOrderInvoicePreview from '~/components/purchase-orders/PurchaseOrderInvoicePreview.vue';
import AdminInvoicePreviewShell from '~/components/shared/AdminInvoicePreviewShell.vue';
import type { PurchaseOrderInvoicePreview as PurchaseOrderInvoicePreviewData } from '~/types/purchase-orders';

const open = defineModel<boolean>('open', { default: false });

defineProps<{
  preview: PurchaseOrderInvoicePreviewData | null;
}>();
</script>

<template>
  <AdminInvoicePreviewShell v-model:open="open">
    <PurchaseOrderInvoicePreview v-if="preview" :preview="preview" />
  </AdminInvoicePreviewShell>
</template>
