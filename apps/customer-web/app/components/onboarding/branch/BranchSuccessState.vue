<script setup lang="ts">
import { Button } from '@gosource/ui';

defineProps<{
  branchName: string;
  branchCode: string;
  isHeadquarter: boolean;
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-[18px] border border-success-100 bg-[rgba(25,184,32,0.06)] px-4 py-4 text-left">
      <p class="text-[14px] font-semibold text-grey-900">
        {{ branchName }} is ready
      </p>
      <p class="mt-1 text-[13px] leading-6 text-grey-text">
        Branch code: <span class="font-semibold text-grey-900">{{ branchCode }}</span>
      </p>
      <p class="text-[13px] leading-6 text-grey-text">
        {{ isHeadquarter ? 'This branch has been marked as your headquarter branch.' : 'This branch was added successfully.' }}
      </p>
    </div>

    <p class="text-center text-[12px] leading-5 text-grey-300">
      Branch onboarding is complete for now. The next customer step is inviting your first team member.
    </p>

    <NuxtLink to="/onboarding/team?step=invite-member" class="block">
      <Button size="medium" class="w-full">
        Invite a team member
      </Button>
    </NuxtLink>
  </div>
</template>
