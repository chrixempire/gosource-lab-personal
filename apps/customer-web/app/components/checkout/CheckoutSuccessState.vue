<script setup lang="ts">
import { Button } from '@gosource/ui';
import { CircleCheckBig } from 'lucide-vue-next';

defineProps<{
  reference: string;
}>();

const emit = defineEmits<{
  viewRequest: [];
  backToRequests: [];
}>();
</script>

<template>
  <section class="rounded-[28px] border border-success-200 bg-success-50 p-6 sm:p-8">
    <div class="flex flex-col items-start gap-4">
      <div class="flex size-14 items-center justify-center rounded-full bg-success-100 text-success-700">
        <CircleCheckBig class="size-7" />
      </div>

      <div>
        <h3>Checkout complete</h3>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-grey-text">
          Request <span class="font-semibold text-grey-900">{{ reference }}</span> has been approved successfully. You can return to the request details or go back to the requests list.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          size="medium"
          class="!w-auto min-w-[10rem]"
          @click="emit('viewRequest')"
        >
          View request
        </Button>
        <Button
          variant="neutral"
          size="medium"
          class="!w-auto min-w-[10rem]"
          @click="emit('backToRequests')"
        >
          Back to requests
        </Button>
      </div>
    </div>
  </section>
</template>
