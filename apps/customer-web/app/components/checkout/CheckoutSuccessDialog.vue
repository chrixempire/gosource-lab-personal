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
import { CircleCheckBig } from 'lucide-vue-next';

defineProps<{
  open: boolean;
  reference: string;
  downloadInvoiceLoading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  downloadInvoice: [];
  trackOrder: [];
  'update:open': [value: boolean];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');

function handleOpenChange(value: boolean) {
  emit('update:open', value);
  if (!value) {
    emit('close');
  }
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="handleOpenChange">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <div class="flex flex-col gap-2">
          <div class="flex size-14 items-center justify-center rounded-full bg-success-100 text-success-700">
            <CircleCheckBig class="size-7" />
          </div>
          <DrawerTitle>
            Payment successful
          </DrawerTitle>
          <DrawerDescription class="text-[12px] leading-5 text-grey-text">
            Request {{ reference }} has been checked out. Your order is ready to track.
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody class="space-y-3">
        <p class="text-sm leading-6 text-grey-text">
          Your payment has been processed. You can follow fulfillment from track orders.
        </p>
      </DrawerBody>

      <DrawerFooter class="gap-3">
        <Button
          variant="neutral"
          size="medium"
          class="w-full"
          :loading="downloadInvoiceLoading"
          :disabled="downloadInvoiceLoading"
          @click="emit('downloadInvoice')"
        >
          Download invoice
        </Button>
        <Button variant="primary" size="medium" class="w-full" @click="emit('trackOrder')">
          Track order
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="handleOpenChange">
    <DialogContent>
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-2 pr-2 text-left">
          <div class="flex size-14 items-center justify-center rounded-full bg-success-100 text-success-700">
            <CircleCheckBig class="size-7" />
          </div>
          <DialogTitle>
            Payment successful
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Request {{ reference }} has been checked out. Your order is ready to track.
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="space-y-3">
        <p class="text-sm leading-6 text-grey-text">
          Your payment has been processed. You can follow fulfillment from track orders.
        </p>
      </DialogBody>

      <DialogFooter class="grid grid-cols-2 gap-3">
        <Button
          variant="neutral"
          size="medium"
          class="w-full"
          :loading="downloadInvoiceLoading"
          :disabled="downloadInvoiceLoading"
          @click="emit('downloadInvoice')"
        >
          Download invoice
        </Button>
        <Button variant="primary" size="medium" class="w-full" @click="emit('trackOrder')">
          Track order
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
