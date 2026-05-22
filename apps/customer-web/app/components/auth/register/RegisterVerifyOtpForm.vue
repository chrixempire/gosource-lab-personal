<script setup lang="ts">
import { Button, OtpInput } from '@gosource/ui';

withDefaults(defineProps<{
  otpCode?: string;
  loading: boolean;
  otpError?: string;
  otpLength?: number;
}>(), {
  otpCode: '',
});

const emit = defineEmits<{
  'update:otpCode': [value: string];
  verify: [];
  resend: [];
}>();
</script>

<template>
  <div class="space-y-5">
    <OtpInput
      :model-value="otpCode ?? ''"
      :maxlength="otpLength ?? 6"
      :disabled="loading"
      :invalid="Boolean(otpError)"
      @update:model-value="emit('update:otpCode', $event ?? '')"
    />
    <p v-if="otpError" class="-mt-2 text-[12px] font-medium text-negative-500">
      {{ otpError }}
    </p>

    <Button
      size="medium"
      class="w-full"
      type="button"
      :loading="loading"
      :disabled="(otpCode ?? '').length !== (otpLength ?? 6)"
      @click="emit('verify')"
    >
      Verify OTP
    </Button>

    <div class="flex items-center justify-center gap-2 text-[13px] text-grey-300">
      <p>Didn’t get the code?</p>
      <button
        type="button"
        class="font-semibold text-primary-500 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-grey-400"
        :disabled="loading"
        @click="emit('resend')"
      >
        Resend OTP
      </button>
    </div>
  </div>
</template>
