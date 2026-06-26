<script setup lang="ts">
import type { BranchRecord, CustomerMeResponse } from '@gosource/api-client';
import { Button, Input, SegmentedControl, toast } from '@gosource/ui';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import {
  formatBranchAddress,
  formatSettingsDate,
  useCustomerProfileService,
} from '~/services/profile.service';
import { useCustomerBranchService } from '~/services/branch.service';
import {
  validatePhoneNumber,
  validateRequiredText,
} from '~/utils/auth-validation';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const { updateMyProfile, getBusinessAccount } = useCustomerProfileService();
const { getBranch } = useCustomerBranchService();
const route = useRoute();
const router = useRouter();

type ProfileTab = 'personal' | 'business';

const profileTabs = [
  { label: 'Personal profile', value: 'personal' },
  { label: 'Business profile', value: 'business' },
];

const activeTab = computed<ProfileTab>(() =>
  route.query.tab === 'business' ? 'business' : 'personal',
);

function setActiveTab(value: string) {
  const tab: ProfileTab = value === 'business' ? 'business' : 'personal';
  void router.replace({
    query: {
      ...route.query,
      tab: tab === 'business' ? 'business' : undefined,
    },
  });
}

const loading = ref(true);
const saving = ref(false);
const businessLoading = ref(true);
const businessName = ref('—');
const branch = ref<BranchRecord | null>(null);

const isOwner = computed(() => isBusinessOwnerSession(session.value));
const branchName = computed(() => branch.value?.branchName ?? '—');
const branchCode = computed(() => branch.value?.branchCode ?? '—');
const businessAddress = computed(() => formatBranchAddress(branch.value));
const dateCreated = computed(() => formatSettingsDate(branch.value?.createdAt ?? null));

const form = reactive({
  firstName: '',
  lastName: '',
  phoneNumber: '',
});

const errors = reactive({
  firstName: '',
  lastName: '',
  phoneNumber: '',
});

const email = computed(() => {
  const data = session.value?.data;
  if (!data || typeof data !== 'object' || !('email' in data)) {
    return '';
  }
  return String(data.email ?? '').trim();
});

const roleLabel = computed(() => {
  if (isBusinessOwnerSession(session.value)) {
    return 'Business owner';
  }

  const data = session.value?.data;
  if (data && typeof data === 'object' && 'role' in data && data.role) {
    return String(data.role);
  }

  return 'Team member';
});

function applySession(value: CustomerMeResponse | null) {
  const data = value?.data;
  if (!data || typeof data !== 'object') {
    return;
  }

  form.firstName = String(data.firstName ?? '').trim();
  form.lastName = String(data.lastName ?? '').trim();
  form.phoneNumber =
    'phoneNumber' in data ? String(data.phoneNumber ?? '').trim() : '';
}

async function refreshSession() {
  const refreshed = await $fetch<CustomerMeResponse>('/api/auth/session/me', {
    credentials: 'same-origin',
  });
  session.value = refreshed;
  applySession(refreshed);
  return refreshed;
}

async function loadProfile() {
  loading.value = true;
  try {
    await refreshSession();
  } finally {
    loading.value = false;
  }
}

async function loadBusinessProfile() {
  businessLoading.value = true;
  try {
    let branchId =
      session.value?.data && 'branchId' in session.value.data
        ? String(session.value.data.branchId ?? '').trim()
        : '';

    if (isOwner.value) {
      const account = await getBusinessAccount();
      if (account?.businessName) {
        businessName.value = account.businessName;
      }
      if (account?.branchId) {
        branchId = account.branchId;
      }
    }

    if (!branchId) {
      branch.value = null;
      return;
    }

    const response = await getBranch(branchId);
    branch.value = response.data ?? null;
  } finally {
    businessLoading.value = false;
  }
}

function validateForm() {
  errors.firstName = validateRequiredText(form.firstName, 'First name');
  errors.lastName = validateRequiredText(form.lastName, 'Last name');
  errors.phoneNumber = validatePhoneNumber(form.phoneNumber);

  return !errors.firstName && !errors.lastName && !errors.phoneNumber;
}

async function onSubmit() {
  if (saving.value || !validateForm()) {
    return;
  }

  saving.value = true;
  try {
    await updateMyProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
    });
    await refreshSession();
    toast.success('Profile updated successfully');
  } finally {
    saving.value = false;
  }
}

watch(session, applySession, { immediate: true });

onMounted(() => {
  void loadProfile();
  void loadBusinessProfile();
});
</script>

<template>
  <div class="flex w-full max-w-2xl flex-col gap-2">
    <SegmentedControl
      class="mb-2 w-full max-w-sm"
      :model-value="activeTab"
      :options="profileTabs"
      @update:model-value="setActiveTab"
    />

    <template v-if="activeTab === 'personal'">
      <p class="text-sm text-grey-300">
        Update your name and phone number. Your phone is required for checkout and order updates.
      </p>

      <section
        v-if="loading"
        class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-6"
        aria-busy="true"
      >
        <div class="space-y-5">
          <div
            v-for="index in 4"
            :key="index"
            class="h-12 animate-pulse rounded-[16px] bg-grey-55"
          />
          <div class="h-11 w-36 animate-pulse rounded-[16px] bg-grey-55" />
        </div>
      </section>

      <form
        v-else
        class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-6"
        @submit.prevent="onSubmit"
      >
      <div class="space-y-5">
        <div class="grid gap-5 min-[560px]:grid-cols-2">
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">First name</span>
            <Input
              v-model="form.firstName"
              autocomplete="given-name"
              :disabled="saving"
              :invalid="Boolean(errors.firstName)"
              @update:model-value="errors.firstName = ''"
            />
            <p v-if="errors.firstName" class="text-[12px] font-medium text-negative-500">
              {{ errors.firstName }}
            </p>
          </label>
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Last name</span>
            <Input
              v-model="form.lastName"
              autocomplete="family-name"
              :disabled="saving"
              :invalid="Boolean(errors.lastName)"
              @update:model-value="errors.lastName = ''"
            />
            <p v-if="errors.lastName" class="text-[12px] font-medium text-negative-500">
              {{ errors.lastName }}
            </p>
          </label>
        </div>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Email address</span>
          <Input :model-value="email" type="email" disabled class="opacity-90" />
          <p class="text-xs text-grey-300">
            Email changes are managed under Security.
          </p>
        </label>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Phone number</span>
          <Input
            v-model="form.phoneNumber"
            type="tel"
            autocomplete="tel"
            :disabled="saving"
            :invalid="Boolean(errors.phoneNumber)"
            @update:model-value="errors.phoneNumber = ''"
          />
          <p v-if="errors.phoneNumber" class="text-[12px] font-medium text-negative-500">
            {{ errors.phoneNumber }}
          </p>
        </label>

        <div class="rounded-[16px] bg-grey-55 px-4 py-3 text-sm text-grey-300">
          Signed in as <span class="font-medium text-grey-900">{{ roleLabel }}</span>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <Button type="submit" size="medium" :loading="saving" class="!w-auto min-w-[140px]">
          Update details
        </Button>
      </div>
      </form>
    </template>

    <template v-else>
      <p class="text-sm text-grey-300">
        {{
          isOwner
            ? 'Your registered business and primary branch details.'
            : 'Branch details linked to your account.'
        }}
      </p>

      <section
        v-if="businessLoading"
        class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-6"
        aria-busy="true"
      >
        <div class="space-y-5">
          <div
            v-for="index in 5"
            :key="index"
            class="h-12 animate-pulse rounded-[16px] bg-grey-55"
          />
        </div>
      </section>

      <section
        v-else
        class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-6"
      >
        <div class="space-y-5">
          <label v-if="isOwner" class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Business name</span>
            <Input :model-value="businessName" disabled class="opacity-90" />
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Branch</span>
            <Input :model-value="branchName" disabled class="opacity-90" />
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Business address</span>
            <Input :model-value="businessAddress" disabled class="opacity-90" />
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Date created</span>
            <Input :model-value="dateCreated" disabled class="opacity-90" />
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Branch code</span>
            <Input :model-value="branchCode" disabled class="opacity-90" />
          </label>
        </div>
      </section>
    </template>
  </div>
</template>
