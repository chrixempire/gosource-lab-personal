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
  enable: boolean;
  customerName?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle class="!text-base !font-semibold !tracking-normal">
          {{ enable ? 'Enable credit' : 'Disable credit' }}
        </DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-700">
          Are you sure you want to {{ enable ? 'enable' : 'disable' }} credit
          <span v-if="customerName" class="font-medium text-grey-900"> for {{ customerName }}</span>?
        </p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" @click="open = false">Cancel</Button>
        <Button
          type="button"
          :variant="enable ? 'primary' : 'destructive'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ enable ? 'Enable credit' : 'Disable credit' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
