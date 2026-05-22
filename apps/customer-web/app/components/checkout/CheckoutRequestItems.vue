<script setup lang="ts">
import type { RequestRecord } from '@gosource/api-client';
import RequestProductLinesEditor from '~/components/requests/RequestProductLinesEditor.vue';

const props = defineProps<{
  request: RequestRecord;
  formatCurrency: (value: number) => string;
}>();

const requestProducts = computed(() =>
  Array.isArray(props.request?.products) ? props.request.products : [],
);
</script>

<template>
  <section class="rounded-[24px] border border-grey-50 bg-white p-5">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-grey-900">Request items</h2>
        <p class="mt-1 text-sm text-grey-text">
          Review the pending request lines before you complete checkout.
        </p>
      </div>
      <p class="rounded-full bg-grey-55 px-3 py-1 text-xs font-semibold text-grey-300">
        {{ requestProducts.length }} {{ requestProducts.length === 1 ? 'item' : 'items' }}
      </p>
    </div>

    <RequestProductLinesEditor
      :products="requestProducts"
      :format-currency="formatCurrency"
    />
  </section>
</template>
