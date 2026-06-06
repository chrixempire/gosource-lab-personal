import { extractApiErrorMessage } from '@gosource/api-client';
import { h } from 'vue';
import CreditRepaymentInvoicePreview from '~/components/credit/CreditRepaymentInvoicePreview.vue';
import {
  buildCreditRepaymentInvoicePreview,
  creditRepaymentInvoiceFileName,
  CREDIT_REPAYMENT_INVOICE_ELEMENT_ID,
} from '~/lib/credit-repayment-invoice';
import { downloadInvoicePdf } from '~/lib/download-invoice-pdf';
import type { AdminRepaymentListItem } from '~/types/credit';
import { toast } from '@gosource/ui';

export function useCreditMutations() {
  const busyId = ref<string | null>(null);

  async function approveApplication(id: string, approvedAmount: number) {
    busyId.value = id;
    try {
      await $fetch(`/api/credit/applications/${id}/approve`, {
        method: 'PATCH',
        body: { approvedAmount },
      });
      toast.success('Credit application approved successfully');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to approve application'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function rejectApplication(id: string, rejectionReason: string) {
    busyId.value = id;
    try {
      await $fetch(`/api/credit/applications/${id}/reject`, {
        method: 'PATCH',
        body: { rejectionReason },
      });
      toast.success('Credit application rejected successfully');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to reject application'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function reopenApplication(id: string, reason: string) {
    busyId.value = id;
    try {
      await $fetch(`/api/credit/applications/${id}/update-status`, {
        method: 'PATCH',
        body: { reason },
      });
      toast.success('Application status updated');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to update application status'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function approveCreditRequest(id: string, body: Record<string, unknown>) {
    busyId.value = id;
    try {
      await $fetch(`/api/credit/requests/${id}/approve`, {
        method: 'PATCH',
        body,
      });
      toast.success('Credit request approved successfully');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to approve credit request'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function rejectCreditRequest(id: string, rejectionReason: string) {
    busyId.value = id;
    try {
      await $fetch(`/api/credit/requests/${id}/reject`, {
        method: 'PATCH',
        body: { rejectionReason },
      });
      toast.success('Credit request rejected successfully');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to reject credit request'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function confirmBankTransfer(id: string, amount: number, approvalNote?: string) {
    busyId.value = id;
    try {
      await $fetch(`/api/credit/payments/${id}/confirm-transfer`, {
        method: 'PATCH',
        body: { amount, approvalNote },
      });
      toast.success('Payment confirmed successfully');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to confirm payment'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function rejectBankTransfer(id: string) {
    busyId.value = id;
    try {
      await $fetch(`/api/credit/payments/${id}/reject-transfer`, {
        method: 'PATCH',
        body: {},
      });
      toast.success('Payment rejected');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to reject payment'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function createInternalNote(targetId: string, body: Record<string, unknown>) {
    busyId.value = targetId;
    try {
      await $fetch(`/api/credit/notes/${targetId}`, {
        method: 'POST',
        body,
      });
      toast.success('Note added');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to add note'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function initialiseChecklist(applicationId: string, documents: string[]) {
    busyId.value = applicationId;
    try {
      await $fetch(`/api/credit/applications/${applicationId}/checklist`, {
        method: 'POST',
        body: { documents },
      });
      toast.success('Checklist initialised successfully');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to initialise checklist'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function updateChecklistItem(
    applicationId: string,
    documentName: string,
    verified: boolean,
  ) {
    busyId.value = applicationId;
    try {
      await $fetch(`/api/credit/applications/${applicationId}/checklist`, {
        method: 'PATCH',
        body: { documentName, verified },
      });
      toast.success('Checklist updated successfully');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to update checklist'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function uploadAdditionalDocuments(applicationId: string, files: File[]) {
    busyId.value = applicationId;
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const response = await $fetch<unknown>(`/api/credit/applications/${applicationId}/additional-docs`, {
        method: 'POST',
        body: formData,
      });
      toast.success('Documents uploaded successfully');
      return response;
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to upload documents'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function downloadRepaymentInvoice(row: AdminRepaymentListItem) {
    busyId.value = row.id;
    try {
      const preview = buildCreditRepaymentInvoicePreview(row);
      await downloadInvoicePdf(creditRepaymentInvoiceFileName(row), {
        renderComponent: () => h(CreditRepaymentInvoicePreview, { preview }),
        elementId: CREDIT_REPAYMENT_INVOICE_ELEMENT_ID,
      });
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to download invoice'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  async function deleteAdditionalDocument(applicationId: string, docKey: string) {
    busyId.value = applicationId;
    try {
      const response = await $fetch<unknown>(
        `/api/credit/applications/${applicationId}/additional-docs/${encodeURIComponent(docKey)}`,
        { method: 'DELETE' },
      );
      toast.success('Document deleted successfully');
      return response;
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to delete document'));
      throw error;
    } finally {
      busyId.value = null;
    }
  }

  return {
    busyId,
    approveApplication,
    rejectApplication,
    reopenApplication,
    approveCreditRequest,
    rejectCreditRequest,
    confirmBankTransfer,
    rejectBankTransfer,
    createInternalNote,
    initialiseChecklist,
    updateChecklistItem,
    uploadAdditionalDocuments,
    deleteAdditionalDocument,
    downloadRepaymentInvoice,
  };
}
