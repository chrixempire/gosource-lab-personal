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
  confirm: [approvedAmount: number];
}>();

const creditLimit = ref('');

watch(open, (value) => {
  if (!value) creditLimit.value = '';
});

function onConfirm() {
  const approvedAmount = nairaToNumber(creditLimit.value);
  if (approvedAmount < 100) return;
  emit('confirm', approvedAmount);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">
          Approve application &amp; set credit terms
        </DialogTitle>
      </DialogHeader>
      <DialogBody class="space-y-3">
        <p class="text-sm text-grey-600">
          Assign the credit limit for this business. These terms will define their credit access on
          GoSource and they will get notified.
        </p>
        <label class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Approved credit limit (₦)</span>
          <CreditFormattedNumberInput v-model="creditLimit" placeholder="0" />
        </label>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="medium" @click="open = false">Cancel</Button>
        <Button type="button" variant="primary" size="medium" :loading="loading" @click="onConfirm">
          Approve
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
