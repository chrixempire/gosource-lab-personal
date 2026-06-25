import { extractApiErrorMessage } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { h } from 'vue';
import OrderInvoicePreview from '~/components/orders/OrderInvoicePreview.vue';
import { unwrapLegacyPayload } from '~/lib/dashboard-api';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { downloadInvoicePdf, INVOICE_PREVIEW_ELEMENT_ID } from '~/lib/download-invoice-pdf';
import { buildOrderInvoicePreview, type OrderInvoiceVariant } from '~/lib/order-invoice';
import type { OrderInvoicePreview as OrderInvoicePreviewData } from '~/types/order-invoice';

export function useOrderMutations() {
  const updatingOrderId = ref<string | null>(null);

  async function updateOrderStatus(orderId: string, status: string) {
    updatingOrderId.value = orderId;
    try {
      await $fetch(`/api/orders/${orderId}/order-status`, {
        method: 'PATCH',
        body: { status },
      });
      toast.success('Order status updated');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to update order status'));
      throw error;
    } finally {
      updatingOrderId.value = null;
    }
  }

  async function updatePaymentStatus(orderId: string, status: string) {
    updatingOrderId.value = orderId;
    try {
      await $fetch(`/api/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        body: { status },
      });
      toast.success('Payment status updated');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to update payment status'));
      throw error;
    } finally {
      updatingOrderId.value = null;
    }
  }

  async function cancelOrder(orderId: string, reason: string) {
    updatingOrderId.value = orderId;
    try {
      await $fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        body: { reason },
      });
      toast.success('Order cancelled');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to cancel order'));
      throw error;
    } finally {
      updatingOrderId.value = null;
    }
  }

  function invoicePdfOptions(preview: OrderInvoicePreviewData) {
    return {
      renderComponent: () =>
        h(OrderInvoicePreview, { preview, infoColumnCount: 4 }),
      elementId: INVOICE_PREVIEW_ELEMENT_ID,
    };
  }

  function invoiceFileName(reference?: string, orderId?: string) {
    const raw = reference ?? orderId ?? 'invoice';
    const safe = raw.replace(/[^a-zA-Z0-9_-]+/g, '_');
    return `order_invoice_${safe}`;
  }

  async function loadOrderInvoicePreview(orderId: string) {
    const payload = await $fetch<unknown>(`/api/orders/${orderId}`);
    const order = unwrapLegacyPayload(payload);

    if (!order) {
      throw new Error('Order not found');
    }

    return buildOrderInvoicePreview(order);
  }

  function buildOrderInvoicePreviewFromRaw(
    order: Record<string, unknown>,
    variant: OrderInvoiceVariant = 'combined',
  ) {
    return buildOrderInvoicePreview(order, variant);
  }

  async function downloadOrderInvoice(orderId: string, reference?: string) {
    updatingOrderId.value = orderId;
    try {
      const preview = await loadOrderInvoicePreview(orderId);
      await downloadInvoicePdf(invoiceFileName(reference, orderId), invoicePdfOptions(preview));
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to download invoice'));
      throw error;
    } finally {
      updatingOrderId.value = null;
    }
  }

  async function downloadOrderInvoiceFromPreview(
    preview: OrderInvoicePreviewData,
    reference?: string,
  ) {
    try {
      await downloadInvoicePdf(invoiceFileName(reference), invoicePdfOptions(preview));
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to download invoice'));
      throw error;
    }
  }

  async function markProductsDelivered(orderId: string, cartIds: string[]) {
    updatingOrderId.value = orderId;
    try {
      await $fetch(`/api/orders/${orderId}/mark-delivered-products`, {
        method: 'PATCH',
        body: { cartIds },
      });
      toast.success('Products marked as delivered');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to mark products as delivered'));
      throw error;
    } finally {
      updatingOrderId.value = null;
    }
  }

  /** Add new (additional) products to an existing order. */
  async function addOrderProducts(
    orderId: string,
    products: { product: string; unit: string; quantity: number }[],
  ) {
    updatingOrderId.value = orderId;
    try {
      await $fetch('/api/orders/add-products', {
        method: 'PATCH',
        body: { orderId, products },
      });
      toast.success('Items added to order');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to add items to order'));
      throw error;
    } finally {
      updatingOrderId.value = null;
    }
  }

  /** Update quantities/units of the added items (omitted items are removed). */
  async function updateOrderProducts(
    orderId: string,
    products: {
      cartId: string;
      productId: string;
      newQuantity: number;
      unit: string;
    }[],
    reason?: string,
  ) {
    updatingOrderId.value = orderId;
    try {
      const response = await $fetch<unknown>(
        `/api/orders/${orderId}/update-order-products`,
        {
          method: 'PATCH',
          body: { products, ...(reason ? { reason } : {}) },
        },
      );

      // Surface any refund the backend computed for reduced/removed items.
      const data = unwrapLegacyPayload(response) as { refundAmount?: number } | null;
      const refund = Number(data?.refundAmount ?? 0);
      if (refund > 0) {
        toast.success(
          `Order items updated · ${formatDashboardCurrency(refund)} refund recorded`,
        );
      } else {
        toast.success('Order items updated');
      }
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to update order items'));
      throw error;
    } finally {
      updatingOrderId.value = null;
    }
  }

  return {
    updatingOrderId,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    markProductsDelivered,
    addOrderProducts,
    updateOrderProducts,
    loadOrderInvoicePreview,
    buildOrderInvoicePreviewFromRaw,
    downloadOrderInvoice,
    downloadOrderInvoiceFromPreview,
  };
}
