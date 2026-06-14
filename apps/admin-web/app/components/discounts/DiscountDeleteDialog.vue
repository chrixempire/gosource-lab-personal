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
  discountCode?: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle>Delete discount</DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-700">
          <template v-if="discountCode">
            This permanently deletes <span class="font-semibold text-grey-900">{{ discountCode }}</span>.
            Customers will no longer be able to use this coupon code.
          </template>
          <template v-else>
            This permanently deletes the selected discount. Customers will no longer be able to use this
            coupon code.
          </template>
        </p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" size="medium" @click="open = false">Cancel</Button>
        <Button type="button" variant="destructive" size="medium" :loading="loading" @click="emit('confirm')">
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
