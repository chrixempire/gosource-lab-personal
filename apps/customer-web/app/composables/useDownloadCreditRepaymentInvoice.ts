import type { CustomerMeResponse } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { h } from 'vue';
import CreditRepaymentInvoicePreview from '~/components/credit/CreditRepaymentInvoicePreview.vue';
import { downloadInvoicePDF } from '~/lib/download-invoice-pdf';
import {
  buildCreditRepaymentInvoicePreview,
  CREDIT_REPAYMENT_INVOICE_ELEMENT_ID,
  creditRepaymentInvoiceFileName,
} from '~/lib/credit-repayment-invoice';
import type { CustomerCreditRepayment } from '~/types/credit';

function resolveBusinessName(session: CustomerMeResponse | null | undefined) {
  const data = session?.data;
  if (!data || typeof data !== 'object') {
    return '';
  }

  if ('businessName' in data && typeof data.businessName === 'string') {
    return data.businessName.trim();
  }

  return '';
}

export function useDownloadCreditRepaymentInvoice() {
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const downloadingId = ref<string | null>(null);

  async function downloadCreditRepaymentInvoice(row: CustomerCreditRepayment) {
    if (downloadingId.value) {
      return;
    }

    downloadingId.value = row.id;

    try {
      const businessName = resolveBusinessName(session.value);
      const preview = buildCreditRepaymentInvoicePreview(row, businessName);

      await downloadInvoicePDF({
        fileName: creditRepaymentInvoiceFileName(row, businessName),
        renderComponent: () => h(CreditRepaymentInvoicePreview, { preview }),
        elementId: CREDIT_REPAYMENT_INVOICE_ELEMENT_ID,
      });

      toast.success('Invoice downloaded');
    } catch {
      toast.error('Unable to download invoice right now.');
    } finally {
      downloadingId.value = null;
    }
  }

  return {
    downloadingRepaymentId: downloadingId,
    downloadCreditRepaymentInvoice,
  };
}
