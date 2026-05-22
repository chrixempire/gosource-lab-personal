const CUSTOMER_REGISTER_FLOW_KEY = 'gosource.customer-register-flow';
const CUSTOMER_BRANCH_DRAFT_KEY = 'gosource.customer-branch-draft';
const CUSTOMER_INVITE_DRAFT_KEY = 'gosource.customer-invite-draft';
const ONBOARDING_STORAGE_TTL_MS = 1000 * 60 * 60 * 2;

type PersistedValue<T> = {
  savedAt: number;
  expiresAt: number;
  value: T;
};

type CustomerRegisterFlow = {
  email: string;
  businessId: string | null;
  verified: boolean;
};

type CustomerBranchDraft = {
  branchName: string;
  streetName: string;
  lga: string;
};

type CustomerInviteDraft = {
  email: string;
  role: 'manager' | 'employee' | '';
  branchId: string;
};

function readFromStorage<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedValue<T>;
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

function writeToStorage<T>(key: string, value: T | null) {
  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
      return;
    }

    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        expiresAt: Date.now() + ONBOARDING_STORAGE_TTL_MS,
        value,
      } satisfies PersistedValue<T>),
    );
  } catch {
    // Ignore storage write issues in local/dev contexts.
  }
}

export default defineNuxtPlugin(() => {
  const registerFlow = useState<CustomerRegisterFlow>('customer-register-flow', () => ({
    email: '',
    businessId: null,
    verified: false,
  }));
  const branchDraft = useState<CustomerBranchDraft>('customer-branch-draft', () => ({
    branchName: '',
    streetName: '',
    lga: '',
  }));
  const inviteDraft = useState<CustomerInviteDraft>('customer-invite-draft', () => ({
    email: '',
    role: '',
    branchId: '',
  }));

  if (!registerFlow.value.email) {
    registerFlow.value = readFromStorage<CustomerRegisterFlow>(CUSTOMER_REGISTER_FLOW_KEY) ?? registerFlow.value;
  }

  if (!branchDraft.value.branchName && !branchDraft.value.streetName && !branchDraft.value.lga) {
    branchDraft.value = readFromStorage<CustomerBranchDraft>(CUSTOMER_BRANCH_DRAFT_KEY) ?? branchDraft.value;
  }

  if (!inviteDraft.value.email && !inviteDraft.value.role && !inviteDraft.value.branchId) {
    inviteDraft.value = readFromStorage<CustomerInviteDraft>(CUSTOMER_INVITE_DRAFT_KEY) ?? inviteDraft.value;
  }

  watch(
    registerFlow,
    (value) => {
      if (!value.email && !value.businessId && !value.verified) {
        writeToStorage(CUSTOMER_REGISTER_FLOW_KEY, null);
        return;
      }

      writeToStorage(CUSTOMER_REGISTER_FLOW_KEY, value);
    },
    { deep: true },
  );

  watch(
    branchDraft,
    (value) => {
      if (!value.branchName && !value.streetName && !value.lga) {
        writeToStorage(CUSTOMER_BRANCH_DRAFT_KEY, null);
        return;
      }

      writeToStorage(CUSTOMER_BRANCH_DRAFT_KEY, value);
    },
    { deep: true },
  );

  watch(
    inviteDraft,
    (value) => {
      if (!value.email && !value.role && !value.branchId) {
        writeToStorage(CUSTOMER_INVITE_DRAFT_KEY, null);
        return;
      }

      writeToStorage(CUSTOMER_INVITE_DRAFT_KEY, value);
    },
    { deep: true },
  );
});
