<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@gosource/ui';

const open = defineModel<boolean>('open', { default: false });

defineProps<{
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  destructive?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
}>();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-700">{{ description }}</p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" @click="open = false">Cancel</Button>
        <Button
          type="button"
          :variant="destructive ? 'destructive' : 'primary'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel ?? 'Confirm' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
