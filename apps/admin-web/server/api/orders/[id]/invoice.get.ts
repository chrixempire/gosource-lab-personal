import { createError, getRouterParam, setHeader } from 'h3';
import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';
import {
  buildOrderInvoicePreview,
  unwrapLegacyOrderDetail,
} from '../../../utils/order-invoice-data';
import { generateOrderInvoicePdf } from '../../../utils/order-invoice-pdf';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Order id is required' });
  }

  const payload = await fetchAdminLegacyApi<unknown>(event, `/admin/order/${id}`, {
    fallbackMessage: 'Unable to load order for invoice',
  });

  const order = unwrapLegacyOrderDetail(payload);
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
    });
  }

  const preview = buildOrderInvoicePreview(order);
  const pdf = await generateOrderInvoicePdf(preview);

  setHeader(event, 'Content-Type', 'application/pdf');
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename=order_invoice_${order.reference ?? id}.pdf`,
  );

  return Buffer.from(pdf);
});
