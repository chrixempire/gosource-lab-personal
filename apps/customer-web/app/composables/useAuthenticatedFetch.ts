import { useCustomerSession } from '~/composables/useCustomerSession';

/** Run a protected API call only after the customer session has been resolved on the client. */
export function useAuthenticatedFetch() {
  const { whenReady } = useCustomerSession();

  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (import.meta.client) {
      await whenReady();
    }
    return fn();
  };
}
