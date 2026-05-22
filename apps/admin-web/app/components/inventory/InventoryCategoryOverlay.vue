<script setup lang="ts">
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import { ADMIN_MODAL_TITLE_CLASS } from '~/lib/admin-dialog';

const open = defineModel<boolean>('open', { default: false });

withDefaults(
  defineProps<{
    title: string;
    dialogClass?: string;
  }>(),
  {
    dialogClass: 'w-[min(92vw,560px)]',
  },
);

const isMobile = useMediaQuery('(max-width: 767px)');
</script>

<template>
  <Drawer v-if="isMobile" v-model:open="open">
    <DrawerContent class="flex max-h-[92vh] flex-col">
      <DrawerHeader>
        <DrawerTitle :class="['min-w-0 flex-1 pr-2', ADMIN_MODAL_TITLE_CLASS]">
          {{ title }}
        </DrawerTitle>
        <DrawerClose class="shrink-0" />
      </DrawerHeader>

      <DrawerBody class="min-h-0 flex-1 overflow-y-auto">
        <slot />
      </DrawerBody>

      <DrawerFooter v-if="$slots.footer">
        <slot name="footer" />
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else v-model:open="open">
    <DialogContent :class="dialogClass">
      <DialogHeader>
        <DialogTitle :class="['min-w-0 flex-1 pr-2', ADMIN_MODAL_TITLE_CLASS]">
          {{ title }}
        </DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="min-h-0 overflow-y-auto">
        <slot />
      </DialogBody>

      <DialogFooter v-if="$slots.footer" class="gap-2">
        <slot name="footer" />
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
