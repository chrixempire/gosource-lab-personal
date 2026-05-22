import { extractApiErrorMessage } from '@gosource/api-client';
import { toast } from '@gosource/ui';

export function useCustomerMutations() {
  const busyCustomerId = ref<string | null>(null);

  async function setCustomerCredit(customerId: string, enable: boolean) {
    busyCustomerId.value = customerId;
    const path = enable ? 'enable-credit' : 'disable-credit';
    try {
      await $fetch(`/api/customers/${path}/${customerId}`, { method: 'PATCH', body: {} });
      toast.success(enable ? 'Credit enabled' : 'Credit disabled');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to update credit'));
      throw error;
    } finally {
      busyCustomerId.value = null;
    }
  }

  async function resetCustomerPassword(customerId: string) {
    busyCustomerId.value = customerId;
    try {
      await $fetch(`/api/customers/${customerId}/reset-password`, {
        method: 'POST',
        body: {},
      });
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to send password reset email'));
      throw error;
    } finally {
      busyCustomerId.value = null;
    }
  }

  async function setCustomerActive(customerId: string, active: boolean) {
    busyCustomerId.value = customerId;
    const path = active ? 'activate' : 'deactivate';
    try {
      await $fetch(`/api/customers/${customerId}/${path}`, { method: 'PATCH', body: {} });
      toast.success(active ? 'Customer activated' : 'Customer deactivated');
    } catch (error) {
      toast.error(
        extractApiErrorMessage(error, active ? 'Unable to activate customer' : 'Unable to deactivate customer'),
      );
      throw error;
    } finally {
      busyCustomerId.value = null;
    }
  }

  async function deleteCustomer(customerId: string) {
    busyCustomerId.value = customerId;
    try {
      await $fetch(`/api/customers/${customerId}/delete`, { method: 'DELETE', body: {} });
      toast.success('Customer account deleted');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to delete customer account'));
      throw error;
    } finally {
      busyCustomerId.value = null;
    }
  }

  return {
    busyCustomerId,
    setCustomerCredit,
    resetCustomerPassword,
    setCustomerActive,
    deleteCustomer,
  };
}
