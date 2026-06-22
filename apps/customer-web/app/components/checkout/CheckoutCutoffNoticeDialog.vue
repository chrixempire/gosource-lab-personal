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

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');

const NOTICE = 'Please note that orders placed past 1pm will be processed the next day.';

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
            Order processing time
          </DrawerTitle>
        </div>
      </DrawerHeader>

      <DrawerBody>
        <DrawerDescription class="text-sm leading-6 text-grey-text">
          {{ NOTICE }}
        </DrawerDescription>
      </DrawerBody>

      <DrawerFooter>
        <Button variant="primary" size="medium" class="w-full" @click="close">
          Got it
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Order processing time
          </DialogTitle>
        </div>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody>
        <DialogDescription class="text-sm leading-6 text-grey-text">
          {{ NOTICE }}
        </DialogDescription>
      </DialogBody>

      <DialogFooter>
        <Button variant="primary" size="medium" class="w-full" @click="close">
          Got it
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
