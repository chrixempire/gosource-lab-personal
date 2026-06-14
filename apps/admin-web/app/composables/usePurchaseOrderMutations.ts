import { extractApiErrorMessage } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { h } from 'vue';
import PurchaseOrderInvoicePreview from '~/components/purchase-orders/PurchaseOrderInvoicePreview.vue';
import { ADMIN_LIST_CACHE_URLS } from '~/lib/admin-list-cache-urls';
import { downloadInvoicePdf, INVOICE_PREVIEW_ELEMENT_ID } from '~/lib/download-invoice-pdf';
import { invalidateAdminListCaches } from '~/lib/invalidate-admin-list-cache';
import {
  buildPurchaseOrderInvoicePreview,
  parsePurchaseOrderDetail,
} from '~/lib/purchase-order-api';
import type { PurchaseOrderFormValues, PurchaseOrderInvoicePreview as PurchaseOrderInvoicePreviewData } from '~/types/purchase-orders';

function buildPurchaseOrderPayload(values: PurchaseOrderFormValues) {
  return {
    productType: values.productType,
    expectedDate: values.expectedDate,
    suppliers: values.suppliers,
    note: values.note || undefined,
    logisticsAmount: Number(values.logisticsAmount) || 0,
    products: values.lineItems.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      quantityReceived: item.quantityReceived,
      totalPrice: item.totalPrice,
    })),
  };
}

export function usePurchaseOrderMutations() {
  const busyOrderId = ref<string | null>(null);

  function invalidatePurchaseOrderListCache() {
    invalidateAdminListCaches([ADMIN_LIST_CACHE_URLS.purchaseOrders]);
  }

  function invalidatePurchaseOrderAndInventoryCaches() {
    invalidateAdminListCaches([
      ADMIN_LIST_CACHE_URLS.purchaseOrders,
      ADMIN_LIST_CACHE_URLS.products,
    ]);
  }

  async function createPurchaseOrder(values: PurchaseOrderFormValues) {
    busyOrderId.value = 'create';
    try {
      const response = await $fetch<unknown>('/api/purchase-orders', {
        method: 'POST',
        body: buildPurchaseOrderPayload(values),
      });
      invalidatePurchaseOrderListCache();
      toast.success('Purchase order created');
      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create purchase order';
      toast.error(message);
      throw error;
    } finally {
      busyOrderId.value = null;
    }
  }

  async function updatePurchaseOrder(orderId: string, values: PurchaseOrderFormValues) {
    busyOrderId.value = orderId;
    try {
      const response = await $fetch<unknown>(`/api/purchase-orders/${orderId}`, {
        method: 'PATCH',
        body: buildPurchaseOrderPayload(values),
      });
      invalidatePurchaseOrderListCache();
      toast.success('Purchase order updated');
      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update purchase order';
      toast.error(message);
      throw error;
    } finally {
      busyOrderId.value = null;
    }
  }

  async function deletePurchaseOrder(orderId: string) {
    busyOrderId.value = orderId;
    try {
      await $fetch(`/api/purchase-orders/${orderId}`, {
        method: 'DELETE',
        body: {},
      });
      invalidatePurchaseOrderListCache();
      toast.success('Purchase order deleted');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete purchase order';
      toast.error(message);
      throw error;
    } finally {
      busyOrderId.value = null;
    }
  }

  async function cancelRemainingItems(orderId: string) {
    busyOrderId.value = orderId;
    try {
      await $fetch(`/api/purchase-orders/${orderId}/cancel-remaining-items`, {
        method: 'POST',
        body: {},
      });
      invalidatePurchaseOrderListCache();
      toast.success('Remaining items cancelled');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to cancel remaining items';
      toast.error(message);
      throw error;
    } finally {
      busyOrderId.value = null;
    }
  }

  async function receiveItems(
    orderId: string,
    receivedItems: { productId: string; quantityReceived: number }[],
  ) {
    busyOrderId.value = orderId;
    try {
      await $fetch(`/api/purchase-orders/${orderId}/receive-items`, {
        method: 'POST',
        body: { receivedItems },
      });
      invalidatePurchaseOrderAndInventoryCaches();
      toast.success('Items received');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to receive items';
      toast.error(message);
      throw error;
    } finally {
      busyOrderId.value = null;
    }
  }

  async function markAllReceived(orderId: string) {
    busyOrderId.value = orderId;
    try {
      await $fetch(`/api/purchase-orders/${orderId}/mark-all-received`, {
        method: 'PATCH',
        body: {},
      });
      invalidatePurchaseOrderAndInventoryCaches();
      toast.success('All items marked as received');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to mark all items as received';
      toast.error(message);
      throw error;
    } finally {
      busyOrderId.value = null;
    }
  }

  async function loadPurchaseOrderInvoicePreview(orderId: string) {
    const payload = await $fetch<unknown>(`/api/purchase-orders/${orderId}`);
    const order = parsePurchaseOrderDetail(payload);

    if (!order) {
      throw new Error('Purchase order not found');
    }

    return buildPurchaseOrderInvoicePreview(order);
  }

  function invoicePdfOptions(preview: PurchaseOrderInvoicePreviewData) {
    return {
      renderComponent: () => h(PurchaseOrderInvoicePreview, { preview }),
      elementId: INVOICE_PREVIEW_ELEMENT_ID,
    };
  }

  function invoiceFileName(referenceLabel?: string, orderId?: string) {
    const raw = referenceLabel ?? orderId ?? 'invoice';
    const safe = raw.replace(/[^a-zA-Z0-9_-]+/g, '_');
    return `purchase_order_invoice_${safe}`;
  }

  async function downloadInvoice(orderId: string, referenceLabel?: string) {
    busyOrderId.value = orderId;
    try {
      const preview = await loadPurchaseOrderInvoicePreview(orderId);
      await downloadInvoicePdf(invoiceFileName(referenceLabel, orderId), invoicePdfOptions(preview));
      toast.success('Invoice downloaded');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download invoice';
      toast.error(message);
      throw error;
    } finally {
      busyOrderId.value = null;
    }
  }

  async function downloadInvoiceFromPreview(
    preview: PurchaseOrderInvoicePreviewData,
    referenceLabel?: string,
  ) {
    try {
      await downloadInvoicePdf(invoiceFileName(referenceLabel), invoicePdfOptions(preview));
      toast.success('Invoice downloaded');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download invoice';
      toast.error(message);
      throw error;
    }
  }

  async function sendInvoice(orderId: string) {
    busyOrderId.value = orderId;
    try {
      await $fetch(`/api/purchase-orders/${orderId}/send-invoice`, {
        method: 'POST',
        body: {},
      });
      toast.success('Invoice sent to suppliers');
    } catch (error) {
      toast.error(
        extractApiErrorMessage(error, 'Unable to send invoice to suppliers'),
      );
      throw error;
    } finally {
      busyOrderId.value = null;
    }
  }

  return {
    busyOrderId,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    cancelRemainingItems,
    receiveItems,
    markAllReceived,
    downloadInvoice,
    downloadInvoiceFromPreview,
    sendInvoice,
  };
}
