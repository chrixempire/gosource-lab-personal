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

defineProps<{
  open: boolean;
  listName: string;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [];
}>();
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Delete list</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <p class="text-sm leading-6 text-grey-text">
          Delete <span class="font-medium text-grey-900">{{ listName }}</span>? This cannot be undone.
        </p>
      </DialogBody>

      <DialogFooter class="gap-3">
        <Button variant="neutral" size="medium" :disabled="submitting" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button variant="destructive" size="medium" :loading="submitting" @click="emit('confirm')">
          Delete list
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
