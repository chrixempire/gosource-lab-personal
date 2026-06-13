<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import {
  STORE_COUNT_ROW_STATUS_LABELS,
  storeCountStatusVariant,
} from '~/lib/store-count-constants';
import type { StoreCountRowStatus } from '~/types/store-count';

defineProps<{
  status: StoreCountRowStatus;
}>();
</script>

<template>
  <StatusTag :variant="storeCountStatusVariant(status)" size="medium">
    {{ STORE_COUNT_ROW_STATUS_LABELS[status] }}
  </StatusTag>
</template>
