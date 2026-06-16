<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@gosource/ui';
import { ADMIN_MODAL_TITLE_CLASS } from '~/lib/admin-dialog';
import { CREDIT_REOPEN_APPLICATION_REASON_OPTIONS } from '~/lib/credit-constants';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [reason: string];
}>();

const reason = ref('Updated documents submitted');
const description = ref('');

watch(open, (value) => {
  if (!value) {
    reason.value = 'Updated documents submitted';
    description.value = '';
  }
});

function onConfirm() {
  const payload = reason.value === 'others' ? description.value.trim() : reason.value;
  if (!payload) return;
  emit('confirm', payload);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">Change application status</DialogTitle>
      </DialogHeader>
      <DialogBody class="space-y-4">
        <p class="text-sm text-grey-600">
          This will update the application status to pending, allowing you to review and continue
          the approval process.
        </p>
        <label class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Reason</span>
          <select
            v-model="reason"
            class="h-10 w-full rounded-lg border border-grey-50 bg-white px-3 text-sm text-grey-900"
          >
            <option
              v-for="option in CREDIT_REOPEN_APPLICATION_REASON_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
        <label v-if="reason === 'others'" class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Description</span>
          <textarea
            v-model="description"
            class="min-h-[100px] w-full rounded-lg border border-grey-50 p-3 text-sm"
            placeholder="Add a note"
          />
        </label>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="medium" @click="open = false">Cancel</Button>
        <Button type="button" variant="primary" size="medium" :loading="props.loading" @click="onConfirm">
          Move to pending
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
