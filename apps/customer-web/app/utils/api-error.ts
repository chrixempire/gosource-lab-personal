import {
  extractApiErrorMessage as extractApiErrorMessageBase,
  extractApiResponseMessage,
  getFetchErrorStatus,
} from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { useCustomerSignOut } from '~/composables/useCustomerSignOut';

export { extractApiResponseMessage };

function isAuthError(error: unknown) {
  const status = getFetchErrorStatus(error);
  return status === 401 || status === 403;
}

export function shouldSuppressCustomerApiError(error?: unknown) {
  const route = useRoute();
  const { isIntentionalSignOut } = useCustomerSignOut();

  if (isIntentionalSignOut()) {
    return true;
  }

  if (route.path.startsWith('/auth') && error != null && isAuthError(error)) {
    return true;
  }

  return false;
}

export function extractApiErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred',
) {
  if (shouldSuppressCustomerApiError(error)) {
    return '';
  }

  return extractApiErrorMessageBase(error, fallback);
}

const TOAST_DEDUPE_MS = 2_500;

export function reportCustomerApiError(
  error: unknown,
  fallback = 'An unexpected error occurred',
) {
  if (shouldSuppressCustomerApiError(error)) {
    return;
  }

  const message = extractApiErrorMessageBase(error, fallback);
  if (!message) {
    return;
  }

  if (import.meta.client) {
    const recent = useState<Record<string, number>>('customer-api-error-toast-dedupe', () => ({}));
    const now = Date.now();
    const lastShown = recent.value[message];

    if (lastShown && now - lastShown < TOAST_DEDUPE_MS) {
      return;
    }

    recent.value = { ...recent.value, [message]: now };
  }

  toast.error(message);
}
