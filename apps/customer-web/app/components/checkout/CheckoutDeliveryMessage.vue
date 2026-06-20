<script setup lang="ts">
import { Clock } from 'lucide-vue-next';
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-[12px] border-l-4 border-[#f7b23b] bg-warning-75 px-3 py-2.5"
    role="note"
  >
    <Clock class="mt-0.5 size-4 shrink-0 text-warning-700" aria-hidden="true" />
    <p class="text-[14px] leading-5 text-warning-700">
      Please note that delivery may take up to
      <strong class="font-semibold">24 hours</strong>.
      You'll be able to see the delivery status on the order page!
    </p>
  </div>
</template>
