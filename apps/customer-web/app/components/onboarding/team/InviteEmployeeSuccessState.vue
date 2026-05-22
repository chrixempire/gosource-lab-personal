<script setup lang="ts">
defineProps<{
  email: string;
  activationUrl: string;
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-[18px] border border-success-100 bg-[rgba(25,184,32,0.06)] px-4 py-4 text-left">
      <p class="text-[14px] font-semibold text-grey-900">
        Invite sent to {{ email }}
      </p>
      <p class="mt-1 text-[13px] leading-6 text-grey-text">
        For local testing, use the activation link below until the invite acceptance page is built.
      </p>
    </div>

    <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
      <p class="text-[12px] font-semibold uppercase tracking-[0.12em] text-grey-300">
        Dev activation link
      </p>
      <p class="mt-2 break-all text-[13px] leading-6 text-grey-900">
        {{ activationUrl }}
      </p>
    </div>
  </div>
</template>
