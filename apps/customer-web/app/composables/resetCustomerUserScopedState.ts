import type { RequestRecord } from '@gosource/api-client';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';

/**
 * Clear useState that is tied to a specific signed-in user (not route data).
 * Call on logout and when adoptSession detects a different user signature.
 */
export function resetCustomerUserScopedState() {
  if (!import.meta.client) {
    return;
  }

  const { clearActiveBranchForLogout } = useBusinessBranchContext();
  clearActiveBranchForLogout();

  const activeRequest = useState<RequestRecord | null>('active-request-edit', () => null);
  const editBaseline = useState<RequestRecord | null>('active-request-edit-baseline', () => null);
  const editDraft = useState<RequestRecord | null>('active-request-edit-draft', () => null);
  const lineMutationLoading = useState('active-request-edit-line-loading', () => false);

  activeRequest.value = null;
  editBaseline.value = null;
  editDraft.value = null;
  lineMutationLoading.value = false;
}
