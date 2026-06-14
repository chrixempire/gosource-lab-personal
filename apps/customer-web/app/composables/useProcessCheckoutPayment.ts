import type { ApproveRequestResponse } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import type { CheckoutPaymentMethodValue } from '~/components/checkout/CheckoutPaymentMethod.vue';
import { useCustomerRequestService } from '~/services/request.service';
import { extractApiErrorMessage } from '~/utils/api-error';

type ProcessCheckoutPaymentOptions = {
  paystackCharged?: boolean;
  paystackReference?: string;
};

function formatPaymentFailedMessage(error: unknown, fallback = 'Unable to complete payment') {
  return `Payment failed: ${extractApiErrorMessage(error, fallback)}`;
}

export function useProcessCheckoutPayment() {
  const { approveRequest } = useCustomerRequestService();
  const submitting = ref(false);

  async function processPayment(
    requestId: string,
    method: CheckoutPaymentMethodValue,
    options?: ProcessCheckoutPaymentOptions,
  ): Promise<ApproveRequestResponse | null> {
    if (!requestId || submitting.value) {
      return null;
    }

    submitting.value = true;
    try {
      const response = await approveRequest(requestId, { paymentMethod: method });

      if (!response?.data) {
        toast.error(formatPaymentFailedMessage(null, 'Unable to complete payment'));
        return null;
      }

      toast.success('Payment successful!');
      return response;
    } catch (error) {
      if (options?.paystackCharged) {
        const reference = options.paystackReference?.trim();
        const referenceHint = reference ? ` Reference: ${reference}.` : '';
        toast.error(
          `Payment was received but your order could not be completed.${referenceHint} Please contact support.`,
        );
      } else {
        toast.error(formatPaymentFailedMessage(error));
      }
      return null;
    } finally {
      submitting.value = false;
    }
  }

  return { processPayment, submitting };
}
