<script setup lang="ts">
defineProps<{
  variant: 'super_admin' | 'member';
}>();
</script>

<template>
  <div
    class="rounded-[16px] border border-grey-50 bg-white px-4 py-3 text-sm text-grey-text"
  >
    <p class="font-semibold text-grey-900">
      {{ variant === 'super_admin' ? 'Super Admin' : 'Member' }} — request list
    </p>
    <ul class="mt-2 list-inside list-disc space-y-1 leading-6">
      <template v-if="variant === 'super_admin'">
        <li>See order requests from every branch</li>
        <li>Filter by branch and status</li>
        <li>Approve, reject, cancel, or edit pending requests</li>
        <li>Reopen rejected requests to edit again</li>
        <li>Checkout creates a request, then pay to approve (reference app)</li>
      </template>
      <template v-else>
        <li>See only requests you created — not other members on your branch</li>
        <li>Open a request to edit quantities or remove lines while it is pending</li>
        <li>Create requests from the market cart (“Send order request”)</li>
        <li>Cancel your own pending requests</li>
        <li>Cannot edit rejected or approved requests</li>
        <li>Cannot approve, reject, or checkout</li>
      </template>
    </ul>
  </div>
</template>
