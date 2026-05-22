<script setup lang="ts">
import type { RequestRecord } from '@gosource/api-client';

defineProps<{
  request: RequestRecord;
}>();
</script>

<template>
  <section class="rounded-[24px] border border-grey-50 bg-white p-5">
    <div class="mb-5">
      <h2 class="text-lg font-semibold text-grey-900">Delivery details</h2>
      <p class="mt-1 text-sm text-grey-text">
        Confirm the branch and requester details for this checkout.
      </p>
    </div>

    <div class="grid gap-4 text-sm min-[560px]:grid-cols-2">
      <div class="rounded-[18px] bg-grey-55 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
          Branch
        </p>
        <p class="mt-2 font-medium text-grey-900">
          {{ request.branchName }}
        </p>
      </div>

      <div class="rounded-[18px] bg-grey-55 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
          Phone
        </p>
        <p class="mt-2 font-medium text-grey-900">
          {{ request.phoneNumber }}
        </p>
      </div>

      <div class="rounded-[18px] bg-grey-55 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
          Initiator
        </p>
        <p class="mt-2 font-medium text-grey-900">
          {{ [request.initiator.firstName, request.initiator.lastName].filter(Boolean).join(' ') || request.initiator.email }}
        </p>
        <p class="mt-1 text-grey-300">
          {{ request.initiator.email }}
        </p>
      </div>

      <div class="rounded-[18px] bg-grey-55 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
          Delivery address
        </p>
        <p class="mt-2 leading-6 text-grey-900">
          {{ request.address.streetAddress }}, {{ request.address.lga }}, {{ request.address.state }}
        </p>
        <p v-if="request.address.directions" class="mt-1 text-grey-300">
          {{ request.address.directions }}
        </p>
      </div>
    </div>
  </section>
</template>
