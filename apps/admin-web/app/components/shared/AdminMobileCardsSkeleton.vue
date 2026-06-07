<script setup lang="ts">
import {
  CREDIT_CARD_SKELETON_CLASS,
  CREDIT_CARDS_GRID_CLASS,
} from '~/lib/credit-page-layout';

withDefaults(
  defineProps<{
    count?: number;
  }>(),
  { count: 6 },
);
</script>

<template>
  <div :class="CREDIT_CARDS_GRID_CLASS">
    <div v-for="index in count" :key="index" :class="CREDIT_CARD_SKELETON_CLASS" />
  </div>
</template>
