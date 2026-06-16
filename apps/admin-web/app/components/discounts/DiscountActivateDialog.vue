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
  mode: 'activate' | 'deactivate';
  loading?: boolean;
}>();

const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle>
          {{ mode === 'deactivate' ? 'Deactivate discount' : 'Activate discount' }}
        </DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-700">
          <template v-if="mode === 'deactivate'">
            This discount will no longer be usable on the storefront until it is activated again.
          </template>
          <template v-else>
            This discount will become available for eligible customers on the storefront.
          </template>
        </p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" size="medium" @click="open = false">Cancel</Button>
        <Button
          type="button"
          size="medium"
          :variant="mode === 'deactivate' ? 'destructive' : 'primary'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ mode === 'deactivate' ? 'Deactivate' : 'Activate' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
