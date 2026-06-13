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
  count: number;
  loading?: boolean;
}>();

const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle>Confirm inventory count</DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-700">
          You are about to update stock levels for {{ count }} item{{ count === 1 ? '' : 's' }}
          based on the counted quantities. You can still make stock adjustments later if needed.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" @click="open = false">Cancel</Button>
        <Button type="button" :loading="loading" @click="emit('confirm')">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
