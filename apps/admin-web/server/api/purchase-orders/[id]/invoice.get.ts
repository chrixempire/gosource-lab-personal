import { createError, getRouterParam, setHeader } from 'h3';
import { fetchAdminLegacyApi } from '../../../utils/admin-legacy-proxy';
import {
  buildPurchaseOrderInvoicePreview,
  parsePurchaseOrderDetail,
} from '../../../utils/purchase-order-invoice-data';
import { generatePurchaseOrderInvoicePdf } from '../../../utils/purchase-order-invoice-pdf';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Purchase order id is required' });
  }

  const payload = await fetchAdminLegacyApi<unknown>(event, `/admin/purchase-order/${id}`, {
    fallbackMessage: 'Unable to load purchase order for invoice',
  });

  const order = parsePurchaseOrderDetail(payload);
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Purchase order not found',
    });
  }

  const preview = buildPurchaseOrderInvoicePreview(order);
  const pdf = await generatePurchaseOrderInvoicePdf(preview);

  setHeader(event, 'Content-Type', 'application/pdf');
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename=purchase_order_invoice_${id}.pdf`,
  );

  return pdf;
});
