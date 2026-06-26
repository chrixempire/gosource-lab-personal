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
  title: string;
  description?: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  /** Raise the dialog/drawer above a host overlay (e.g. a slide panel). */
  contentClass?: string;
  overlayClass?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  'update:open': [value: boolean];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');

const drawerContentClass = computed(() =>
  ['max-h-[92vh]', props.contentClass].filter(Boolean).join(' '),
);

function close() {
  emit('update:open', false);
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent :class="drawerContentClass" :overlay-class="overlayClass">
      <DrawerHeader>
        <div class="flex flex-col gap-1">
          <DrawerTitle>
            {{ title }}
          </DrawerTitle>
          <DrawerDescription v-if="description" class="text-[12px] leading-5 text-grey-text">
            {{ description }}
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody class="space-y-3">
        <p class="text-sm leading-6 text-grey-text">
          {{ message }}
        </p>
      </DrawerBody>

      <DrawerFooter class="gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="loading" @click="close">
          Cancel
        </Button>
        <Button
          :variant="destructive !== false ? 'destructive' : 'primary'"
          size="medium"
          class="w-full"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent :class="contentClass" :overlay-class="overlayClass">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            {{ title }}
          </DialogTitle>
          <DialogDescription v-if="description" class="text-[12px] leading-5 text-grey-text">
            {{ description }}
          </DialogDescription>
        </div>

        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="space-y-3">
        <p class="text-sm leading-6 text-grey-text">
          {{ message }}
        </p>
      </DialogBody>

      <DialogFooter class="grid grid-cols-2 gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="loading" @click="close">
          Cancel
        </Button>
        <Button
          :variant="destructive !== false ? 'destructive' : 'primary'"
          size="medium"
          class="w-full"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
