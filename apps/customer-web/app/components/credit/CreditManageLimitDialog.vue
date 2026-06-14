<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  toast,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import CreditApplySelectField from '~/components/credit/CreditApplySelectField.vue';
import CreditFileUploadField from '~/components/credit/CreditFileUploadField.vue';
import {
  CREDIT_APPLY_REVENUE_OPTIONS,
  validateCreditApplyFile,
} from '~/lib/credit-apply';
import { useCustomerCreditService } from '~/services/credit.service';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  success: [];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');
const { submitLimitIncrease } = useCustomerCreditService();
const submitting = ref(false);
const revenueRange = ref('');
const bankStatement = ref<File | null>(null);
const errors = reactive({
  revenueRange: '',
  bankStatement: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    revenueRange.value = '';
    bankStatement.value = null;
    errors.revenueRange = '';
    errors.bankStatement = '';
  },
);

function close() {
  emit('update:open', false);
}

async function submit() {
  errors.revenueRange = revenueRange.value ? '' : 'Monthly revenue range is required';
  errors.bankStatement = validateCreditApplyFile(bankStatement.value, 'Bank statement');
  if (errors.revenueRange || errors.bankStatement) {
    return;
  }

  const formData = new FormData();
  formData.append('revenueRange', revenueRange.value);
  formData.append('bankStatement', bankStatement.value!);

  submitting.value = true;
  try {
    await submitLimitIncrease(formData);
    emit('success');
    close();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <DrawerTitle>Request a credit limit increase</DrawerTitle>
        <DrawerDescription class="text-[12px] leading-5 text-grey-text">
          Share updated revenue and a recent bank statement so we can review your limit.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody class="space-y-4">
        <CreditApplySelectField
          v-model="revenueRange"
          :options="[...CREDIT_APPLY_REVENUE_OPTIONS]"
          placeholder="Select monthly revenue"
          :disabled="submitting"
          :error="errors.revenueRange"
        >
          Monthly revenue range
        </CreditApplySelectField>
        <CreditFileUploadField
          v-model="bankStatement"
          :disabled="submitting"
          :error="errors.bankStatement"
          @file-error="toast.error($event)"
        >
          Upload your bank statement (last 3 months)
        </CreditFileUploadField>
      </DrawerBody>
      <DrawerFooter class="gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="submitting" @click="close">Cancel</Button>
        <Button variant="primary" size="medium" class="w-full" :loading="submitting" @click="submit">
          Submit request
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Request a credit limit increase
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Share updated revenue and a recent bank statement so we can review your limit.
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0" :disabled="submitting" />
      </DialogHeader>
      <DialogBody class="space-y-4">
        <CreditApplySelectField
          v-model="revenueRange"
          :options="[...CREDIT_APPLY_REVENUE_OPTIONS]"
          placeholder="Select monthly revenue"
          :disabled="submitting"
          :error="errors.revenueRange"
        >
          Monthly revenue range
        </CreditApplySelectField>
        <CreditFileUploadField
          v-model="bankStatement"
          :disabled="submitting"
          :error="errors.bankStatement"
          @file-error="toast.error($event)"
        >
          Upload your bank statement (last 3 months)
        </CreditFileUploadField>
      </DialogBody>
      <DialogFooter class="gap-3">
        <Button variant="neutral" size="medium" :disabled="submitting" @click="close">Cancel</Button>
        <Button variant="primary" size="medium" :loading="submitting" @click="submit">Submit request</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
