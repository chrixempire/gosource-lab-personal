<script setup lang="ts">
import { Button, Input } from '@gosource/ui';

defineProps<{
  businessName: string;
  email: string;
  loading: boolean;
  businessNameError?: string;
  emailError?: string;
}>();

const emit = defineEmits<{
  'update:businessName': [value: string];
  'update:email': [value: string];
  submit: [];
}>();
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Business name</span>
      <Input
        :model-value="businessName"
        autocomplete="organization"
        placeholder="Example Foods Ltd"
        :disabled="loading"
        :invalid="Boolean(businessNameError)"
        @update:model-value="emit('update:businessName', $event)"
      />
      <p v-if="businessNameError" class="text-[12px] font-medium text-negative-500">
        {{ businessNameError }}
      </p>
    </label>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Email address</span>
      <Input
        :model-value="email"
        type="email"
        autocomplete="email"
        placeholder="you@business.com"
        :disabled="loading"
        :invalid="Boolean(emailError)"
        @update:model-value="emit('update:email', $event)"
      />
      <p v-if="emailError" class="text-[12px] font-medium text-negative-500">
        {{ emailError }}
      </p>
    </label>

    <Button size="medium" class="w-full" type="submit" :loading="loading">
      Continue
    </Button>
  </form>
</template>
