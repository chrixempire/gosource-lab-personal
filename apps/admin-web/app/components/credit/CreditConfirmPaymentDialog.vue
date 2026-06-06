<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@gosource/ui';
import CreditFormattedNumberInput from '~/components/credit/CreditFormattedNumberInput.vue';
import { ADMIN_MODAL_TITLE_CLASS } from '~/lib/admin-dialog';
import { nairaToNumber } from '~/lib/credit-money';

const open = defineModel<boolean>('open', { default: false });

defineProps<{ loading?: boolean }>();

const emit = defineEmits<{
  confirm: [amount: number];
}>();

const amount = ref('');

watch(open, (value) => {
  if (!value) amount.value = '';
});

function onConfirm() {
  const parsed = nairaToNumber(amount.value);
  if (parsed <= 0) return;
  emit('confirm', parsed);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">Confirm repayment</DialogTitle>
      </DialogHeader>
      <DialogBody class="space-y-3">
        <p class="text-sm text-grey-600">
          Enter the amount received by the business and confirm payment.
        </p>
        <label class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Amount repaid (₦)</span>
          <CreditFormattedNumberInput v-model="amount" placeholder="0" />
        </label>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="small" @click="open = false">Cancel</Button>
        <Button type="button" variant="primary" size="small" :loading="loading" @click="onConfirm">
          Confirm payment
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
