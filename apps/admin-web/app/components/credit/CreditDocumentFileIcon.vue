<script setup lang="ts">
import { FileImage } from 'lucide-vue-next';
import type { CreditDocumentKind } from '~/lib/credit-document';

defineProps<{
  kind: CreditDocumentKind;
}>();
</script>

<template>
  <div
    class="flex size-8 shrink-0 items-center justify-center"
    aria-hidden="true"
  >
    <svg
      v-if="kind === 'pdf'"
      viewBox="0 0 32 32"
      class="size-8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 4h11l5 5v19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        fill="#fff"
        stroke="#D1D5DB"
        stroke-width="1"
      />
      <path d="M19 4v5a1 1 0 0 0 1 1h5" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1" />
      <rect x="6" y="20" width="20" height="8" rx="1" fill="#E53935" />
      <text
        x="16"
        y="25.5"
        fill="#fff"
        font-size="6"
        font-weight="700"
        text-anchor="middle"
        font-family="system-ui, sans-serif"
      >
        PDF
      </text>
    </svg>

    <div
      v-else-if="kind === 'image'"
      class="flex size-8 items-center justify-center rounded-md border border-grey-50 bg-grey-25"
    >
      <FileImage class="size-4 text-grey-600" />
    </div>

    <svg
      v-else
      viewBox="0 0 32 32"
      class="size-8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 4h11l5 5v19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        fill="#fff"
        stroke="#D1D5DB"
        stroke-width="1"
      />
      <path d="M19 4v5a1 1 0 0 0 1 1h5" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1" />
    </svg>
  </div>
</template>
