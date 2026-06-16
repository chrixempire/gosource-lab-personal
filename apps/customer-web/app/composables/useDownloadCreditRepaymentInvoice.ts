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
import { resolveInvoiceBusinessName } from '~/lib/resolve-invoice-business-name';
import { useCustomerProfileService } from '~/services/profile.service';
import type { CustomerCreditRepayment } from '~/types/credit';

export function useDownloadCreditRepaymentInvoice() {
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const { getBusinessAccount } = useCustomerProfileService();
  const downloadingId = ref<string | null>(null);

  async function downloadCreditRepaymentInvoice(row: CustomerCreditRepayment) {
    if (downloadingId.value) {
      return;
    }

    downloadingId.value = row.id;

    try {
      const businessName = await resolveInvoiceBusinessName(session.value, () =>
        getBusinessAccount({ silent: true }),
      );
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
