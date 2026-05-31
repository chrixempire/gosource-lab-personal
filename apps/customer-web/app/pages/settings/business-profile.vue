<script setup lang="ts">
import type { BranchRecord, CustomerMeResponse } from '@gosource/api-client';
import { Input } from '@gosource/ui';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import {
  formatBranchAddress,
  formatSettingsDate,
  useCustomerProfileService,
} from '~/services/profile.service';
import { useCustomerBranchService } from '~/services/branch.service';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const { getBusinessAccount } = useCustomerProfileService();
const { getBranch } = useCustomerBranchService();

const loading = ref(true);
const businessName = ref('—');
const branch = ref<BranchRecord | null>(null);

const isOwner = computed(() => isBusinessOwnerSession(session.value));

const branchName = computed(() => branch.value?.branchName ?? '—');
const branchCode = computed(() => branch.value?.branchCode ?? '—');
const businessAddress = computed(() => formatBranchAddress(branch.value));
const dateCreated = computed(() =>
  formatSettingsDate(branch.value?.createdAt ?? null),
);

async function loadBusinessProfile() {
  loading.value = true;

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
    loading.value = false;
  }
}

onMounted(() => {
  void loadBusinessProfile();
});
</script>

<template>
  <div class="flex w-full max-w-2xl flex-col gap-6">
    <p class="text-sm text-grey-300">
      {{
        isOwner
          ? 'Your registered business and primary branch details.'
          : 'Branch details linked to your account.'
      }}
    </p>

    <section
      v-if="loading"
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
  </div>
</template>
