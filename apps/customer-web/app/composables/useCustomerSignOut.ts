/**
 * Guards intentional sign-out from session-expired handling and 401 error toasts
 * fired by in-flight requests that complete after cookies are cleared.
 */
export function useCustomerSignOut() {
  const intentionalSignOut = useState('customer-intentional-sign-out', () => false);

  function beginIntentionalSignOut() {
    intentionalSignOut.value = true;
  }

  function endIntentionalSignOut() {
    intentionalSignOut.value = false;
  }

  function isIntentionalSignOut() {
    return intentionalSignOut.value;
  }

  return {
    intentionalSignOut,
    beginIntentionalSignOut,
    endIntentionalSignOut,
    isIntentionalSignOut,
  };
}
