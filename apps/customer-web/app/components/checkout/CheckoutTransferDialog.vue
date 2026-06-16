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

const props = defineProps<{
  open: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  'update:open': [value: boolean];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');

function close() {
  emit('update:open', false);
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <div class="flex flex-col gap-1">
          <DrawerTitle>
            Transfer payment
          </DrawerTitle>
          <DrawerDescription class="text-[12px] leading-5 text-grey-text">
            Use transfer as the checkout method for this request.
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody class="space-y-4">
        <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Bank
          </p>
          <p class="mt-2 font-medium text-grey-900">PROVIDUS BANK</p>
        </div>
        <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Account number
          </p>
          <p class="mt-2 font-medium text-grey-900">9654219262</p>
        </div>
        <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Account name
          </p>
          <p class="mt-2 font-medium text-grey-900">GO SOURCE SERVICES-LCO</p>
        </div>
      </DrawerBody>

      <DrawerFooter class="gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="loading" @click="close">
          Cancel
        </Button>
        <Button variant="primary" size="medium" class="w-full" :loading="loading" @click="emit('confirm')">
          I have made the transfer
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Transfer payment
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Use transfer as the checkout method for this request.
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="space-y-4">
        <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Bank
          </p>
          <p class="mt-2 font-medium text-grey-900">Providus Bank</p>
        </div>
        <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Account number
          </p>
          <p class="mt-2 font-medium text-grey-900">2932505737</p>
        </div>
        <div class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
            Account name
          </p>
          <p class="mt-2 font-medium text-grey-900">GoSource Technologies Limited</p>
        </div>
      </DialogBody>

      <DialogFooter class="grid grid-cols-2 gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="loading" @click="close">
          Cancel
        </Button>
        <Button variant="primary" size="medium" class="w-full" :loading="loading" @click="emit('confirm')">
          I have made the transfer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
