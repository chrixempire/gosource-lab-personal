<script setup lang="ts">
import type { PasswordRuleState } from '~/utils/auth-validation';

defineProps<{
  rules: PasswordRuleState[];
}>();
</script>

<template>
  <ul class="space-y-2">
    <li
      v-for="rule in rules"
      :key="rule.id"
      class="flex items-center gap-2 text-[12px] leading-5 transition"
      :class="rule.met ? 'text-success-700' : 'text-grey-400'"
    >
      <span
        v-if="rule.met"
        class="inline-flex size-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white"
        aria-hidden="true"
      >
        ✓
      </span>
      <span
        v-else
        class="inline-block size-2 rounded-full bg-grey-400"
        aria-hidden="true"
      />
      <span>{{ rule.label }}</span>
    </li>
  </ul>
</template>
