import type { CustomerMeResponse, OrderDetailRecord } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { h } from 'vue';
import DownloadableOrderInvoice from '~/components/orders/DownloadableOrderInvoice.vue';
import { downloadInvoicePDF } from '~/lib/download-invoice-pdf';
import {
  buildInvoiceFileName,
  mapOrderDetailToInvoicePayload,
} from '~/lib/order-invoice-payload';
import { useCustomerOrderService } from '~/services/order.service';

function resolveBusinessName(session: CustomerMeResponse | null | undefined) {
  const data = session?.data;
  if (!data || typeof data !== 'object') {
    return '';
  }

  if ('businessName' in data && typeof data.businessName === 'string') {
    return data.businessName.trim();
  }

  const firstName = 'firstName' in data ? String(data.firstName ?? '').trim() : '';
  const lastName = 'lastName' in data ? String(data.lastName ?? '').trim() : '';
  return [firstName, lastName].filter(Boolean).join(' ');
}

/** Matches gosource-web-app track-orders invoice download flow. */
export function useDownloadOrderInvoice() {
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const downloading = ref(false);
  const { getOrder } = useCustomerOrderService();

  async function downloadOrderInvoice(orderOrId: OrderDetailRecord | string) {
    if (downloading.value) {
      return;
    }

    downloading.value = true;

    try {
      const order =
        typeof orderOrId === 'string'
          ? (await getOrder(orderOrId)).data ?? null
          : orderOrId;

      if (!order) {
        throw new Error('Order not found');
      }

      const businessName = resolveBusinessName(session.value);
      const invoiceOrders = mapOrderDetailToInvoicePayload(order, businessName);
      const fileName = buildInvoiceFileName(order, businessName);

      await downloadInvoicePDF({
        fileName,
        renderComponent: () =>
          h(DownloadableOrderInvoice, {
            orders: invoiceOrders,
          }),
        elementId: 'invoice-temp',
      });
    } catch {
      toast.error('Unable to download invoice right now.');
    } finally {
      downloading.value = false;
    }
  }

  return {
    downloadingInvoice: downloading,
    downloadOrderInvoice,
  };
}
