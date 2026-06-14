<script setup lang="ts">
import { Button, Input, toast } from '@gosource/ui';
import { useCustomerRequestService } from '~/services/request.service';

const props = defineProps<{
  requestId: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  applied: [];
}>();

const { applyCoupon } = useCustomerRequestService();
const couponCode = ref('');
const applying = ref(false);

async function handleApplyCoupon() {
  const code = couponCode.value.trim();
  if (!code || applying.value || props.disabled) {
    return;
  }

  applying.value = true;
  try {
    await applyCoupon(props.requestId, { code });
    toast.success('Coupon applied successfully');
    couponCode.value = '';
    emit('applied');
  } catch {
    // Error toast handled in service.
  } finally {
    applying.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
    <Input
      v-model="couponCode"
      placeholder="Enter coupon code"
      class="flex-1"
      :disabled="disabled || applying"
      @keyup.enter="handleApplyCoupon"
    />
    <Button
      type="button"
      variant="primary"
      size="small"
      class="!w-full sm:!w-auto sm:min-w-[104px]"
      :disabled="disabled || applying || !couponCode.trim()"
      :loading="applying"
      @click="handleApplyCoupon"
    >
      Apply
    </Button>
  </div>
</template>
