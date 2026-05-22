<script setup lang="ts">
import type { EmployeeMemberDetail } from '@gosource/api-client';
import { Input, StatusTag } from '@gosource/ui';

defineProps<{
  detail: EmployeeMemberDetail;
}>();

function formatRole(role: string) {
  if (!role) {
    return '—';
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function statusLabelFromApi(status: string) {
  const s = status.toLowerCase();
  if (s === 'active') {
    return 'Active';
  }
  if (s === 'inactive') {
    return 'Inactive';
  }
  if (s === 'pending') {
    return 'Pending';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusVariantFromApi(status: string): 'success' | 'negative' | 'warning' {
  const s = status.toLowerCase();
  if (s === 'inactive') {
    return 'negative';
  }
  if (s === 'pending') {
    return 'warning';
  }
  return 'success';
}
</script>

<template>
  <div class="space-y-4">
    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Email</span>
      <Input :model-value="detail.email" disabled class="opacity-90" />
    </label>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label class="block space-y-2">
        <span class="text-[13px] font-semibold text-grey-text">First name</span>
        <Input :model-value="detail.firstName || ''" placeholder="—" disabled />
      </label>
      <label class="block space-y-2">
        <span class="text-[13px] font-semibold text-grey-text">Last name</span>
        <Input :model-value="detail.lastName || ''" placeholder="—" disabled />
      </label>
    </div>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Phone number</span>
      <Input :model-value="detail.phoneNumber || ''" placeholder="—" disabled />
    </label>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Position</span>
      <Input :model-value="detail.position || ''" placeholder="—" disabled />
    </label>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
      <label class="block space-y-2">
        <span class="text-[13px] font-semibold text-grey-text">Role</span>
        <Input :model-value="formatRole(detail.role)" disabled />
      </label>

      <div class="block space-y-2">
        <span class="block text-[13px] font-semibold text-grey-text">Status</span>
        <div class="flex min-h-10 items-center">
          <StatusTag
            :variant="statusVariantFromApi(detail.status)"
            size="medium"
            class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
          >
            {{ statusLabelFromApi(detail.status) }}
          </StatusTag>
        </div>
      </div>
    </div>
  </div>
</template>
