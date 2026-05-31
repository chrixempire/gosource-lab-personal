<script setup lang="ts">
const reason = defineModel<string>('reason', { required: true });
</script>

<template>
  <div class="rounded-[18px] border border-negative-100 bg-negative-50/40 p-4">
    <label class="mb-2 block text-sm font-medium text-grey-900">Reason for rejection</label>
    <textarea
      v-model="reason"
      rows="4"
      class="w-full rounded-[12px] border border-border-input-default bg-background-on-canvas px-4 py-3 text-sm outline-none transition focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12"
      placeholder="Tell the requester why this request is being rejected"
    />
  </div>
</template>
