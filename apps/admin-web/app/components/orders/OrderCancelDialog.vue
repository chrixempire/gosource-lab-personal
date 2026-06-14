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

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  orderReference?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [reason: string];
}>();

const reason = ref('');

watch(open, (value) => {
  if (!value) {
    reason.value = '';
  }
});

function onConfirm() {
  const trimmed = reason.value.trim();
  if (!trimmed) {
    return;
  }
  emit('confirm', trimmed);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">Cancel order</DialogTitle>
      </DialogHeader>
      <DialogBody class="space-y-3">
        <p class="text-sm text-grey-600">
          Cancel {{ orderReference ? orderReference : 'this order' }}? This action cannot be undone.
        </p>
        <label class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Reason</span>
          <Input v-model="reason" placeholder="Enter cancellation reason" />
        </label>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="medium" @click="open = false">
          Close
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="medium"
          :loading="loading"
          :disabled="!reason.trim()"
          @click="onConfirm"
        >
          Cancel order
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
