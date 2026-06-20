<script setup lang="ts">
import type { RequestRecord } from '@gosource/api-client';
import { MapPin } from 'lucide-vue-next';

const props = defineProps<{
  request: RequestRecord;
  embedded?: boolean;
}>();

const formattedAddress = computed(() => {
  const { streetAddress, lga, state, directions } = props.request.address;
  const parts = [streetAddress, lga, state].filter(Boolean);

  if (directions?.trim()) {
    parts.push(directions.trim());
  }

  return parts.join(', ');
});

const initiatorName = computed(() => {
  const { firstName, lastName, email } = props.request.initiator;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || email;
});
</script>

<template>
  <component
    :is="embedded ? 'div' : 'section'"
    :class="embedded ? undefined : 'rounded-[24px] border border-grey-50 bg-background-on-canvas p-5'"
  >
    <div :class="embedded ? 'mb-4' : 'mb-5'">
      <h2 class="text-lg font-semibold text-grey-900">Delivery details</h2>
      <p class="mt-1 text-sm text-grey-text">
        Confirm the branch and requester details for this checkout.
      </p>
    </div>

    <div class="flex items-start gap-3">
      <MapPin class="mt-0.5 size-5 shrink-0 text-grey-300" aria-hidden="true" />
      <p class="min-w-0 break-words text-sm leading-6 text-grey-900 [overflow-wrap:anywhere]">
        {{ formattedAddress }}
      </p>
    </div>

    <div class="my-4 border-b border-grey-50" />

    <div class="space-y-4">
      <div class="flex items-start gap-4">
        <div class="min-w-0 flex-1 basis-0">
          <p class="text-sm font-semibold text-grey-900">Name</p>
          <p class="mt-1 break-words text-sm text-grey-300 [overflow-wrap:anywhere]">
            {{ initiatorName }}
          </p>
        </div>
        <div class="min-w-0 flex-1 basis-0">
          <p class="text-sm font-semibold text-grey-900">Email</p>
          <p class="mt-1 break-words text-sm text-grey-300 [overflow-wrap:anywhere]">
            {{ request.initiator.email }}
          </p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="min-w-0 flex-1 basis-0">
          <p class="text-sm font-semibold text-grey-900">Branch</p>
          <p class="mt-1 break-words text-sm text-grey-300 [overflow-wrap:anywhere]">
            {{ request.branchName }}
          </p>
        </div>
        <div class="min-w-0 flex-1 basis-0">
          <p class="text-sm font-semibold text-grey-900">Phone number</p>
          <p class="mt-1 break-words text-sm text-grey-300 [overflow-wrap:anywhere]">
            {{ request.phoneNumber }}
          </p>
        </div>
      </div>
    </div>
  </component>
</template>
