<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';

defineProps<{
  hasItems?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
}>();
</script>

<template>
  <div
    v-if="hasItems"
    class="flex shrink-0 items-center justify-center gap-2 border-t border-grey-50 bg-[#FAFBFC] px-4 py-3 text-sm text-grey-300"
  >
    <span v-if="loadingMore" class="flex items-center gap-2 text-primary-500">
      <LoaderCircle class="size-4 animate-spin" />
      <span>Loading more orders…</span>
    </span>
    <span v-else-if="!hasMore">No more orders</span>
  </div>
</template>
