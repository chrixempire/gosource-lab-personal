<script setup lang="ts">
import EmptyState from '~/components/shared/EmptyState.vue';

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex items-center justify-center border-t border-grey-50 px-6 py-12">
    <EmptyState
      class="!border-none !bg-transparent !px-0 !py-0"
      :title="title"
      :description="description"
    />
  </div>
</template>
