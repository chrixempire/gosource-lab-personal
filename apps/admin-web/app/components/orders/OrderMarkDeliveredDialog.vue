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
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
}>();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle>Mark products as delivered</DialogTitle>
        <DialogClose class="shrink-0" :disabled="loading" />
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-700">
          You are about to update this order&apos;s delivery status. Marking some items as
          delivered will move the order to Partially delivered until every item is completed.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" size="medium" :disabled="loading" @click="open = false">
          Cancel
        </Button>
        <Button type="button" size="medium" :loading="loading" @click="emit('confirm')">
          Mark as delivered
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
