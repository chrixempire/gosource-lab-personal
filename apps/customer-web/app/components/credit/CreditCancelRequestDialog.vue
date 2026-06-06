<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import type { CustomerCreditRequest } from '~/types/credit';
import { useCustomerCreditService } from '~/services/credit.service';

const props = defineProps<{
  open: boolean;
  request: CustomerCreditRequest | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  success: [];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');
const { cancelRequest } = useCustomerCreditService();
const submitting = ref(false);

function close() {
  emit('update:open', false);
}

async function submit() {
  if (!props.request?.id) {
    return;
  }

  submitting.value = true;
  try {
    await cancelRequest(props.request.id);
    emit('success');
    close();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[85vh]">
      <DrawerHeader>
        <DrawerTitle class="text-[24px] font-semibold text-grey-900">Cancel credit request</DrawerTitle>
        <DrawerDescription class="text-[12px] leading-5 text-grey-text">
          You'll need to submit a new request if you change your mind later.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody>
        <p class="text-sm text-grey-600">
          If you cancel this credit request, you’ll need to submit a new application if you change
          your mind later. Are you sure you want to proceed?
        </p>
      </DrawerBody>
      <DrawerFooter class="gap-3">
        <Button variant="neutral" class="w-full" :disabled="submitting" @click="close">Keep request</Button>
        <Button variant="destructive" class="w-full" :loading="submitting" @click="submit">
          Cancel request
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle class="text-[24px] font-semibold text-grey-900">Cancel credit request</DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            This action cannot be undone.
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0" :disabled="submitting" />
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-600">
          If you cancel this credit request, you’ll need to submit a new application if you change
          your mind later. Are you sure you want to proceed?
        </p>
      </DialogBody>
      <DialogFooter class="gap-3">
        <Button variant="neutral" :disabled="submitting" @click="close">Keep request</Button>
        <Button variant="destructive" :loading="submitting" @click="submit">Cancel request</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
