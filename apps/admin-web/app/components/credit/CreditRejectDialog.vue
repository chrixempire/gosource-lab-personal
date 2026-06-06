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
  title: string;
  description: string;
  loading?: boolean;
  reasonOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  confirm: [rejectionReason: string];
}>();

const reason = ref('');
const description = ref('');

watch(
  () => props.reasonOptions,
  (options) => {
    if (!reason.value && options[0]) {
      reason.value = options[0].value;
    }
  },
  { immediate: true },
);

watch(open, (value) => {
  if (!value) {
    reason.value = props.reasonOptions[0]?.value ?? '';
    description.value = '';
  }
});

function onConfirm() {
  const rejectionReason =
    reason.value === 'others' ? description.value.trim() : reason.value;
  if (!rejectionReason) return;
  emit('confirm', rejectionReason);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">{{ title }}</DialogTitle>
      </DialogHeader>
      <DialogBody class="space-y-4">
        <p class="text-sm text-grey-600">{{ description }}</p>
        <label class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Reason</span>
          <select
            v-model="reason"
            class="h-10 w-full rounded-lg border border-grey-50 bg-white px-3 text-sm text-grey-900"
          >
            <option
              v-for="option in reasonOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
        <label v-if="reason === 'others'" class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Description</span>
          <Input v-model="description" placeholder="Add a note" />
        </label>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="small" @click="open = false">
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="small"
          :loading="loading"
          @click="onConfirm"
        >
          Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
