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

const open = defineModel<boolean>('open', { default: false });

defineProps<{
  requestReference?: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{ confirm: [reason: string] }>();

const reason = defineModel<string>('reason', { default: '' });

const isMobile = useMediaQuery('(max-width: 600px)');

const canSubmit = computed(() => reason.value.trim().length > 0);

function close() {
  open.value = false;
}

function submit() {
  const nextReason = reason.value.trim();
  if (!nextReason) {
    return;
  }

  emit('confirm', nextReason);
}

watch(open, (nextOpen) => {
  if (!nextOpen) {
    reason.value = '';
  }
});
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="open = $event">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <div class="flex flex-col gap-1 text-left">
          <DrawerTitle>Reject order request</DrawerTitle>
          <DrawerDescription class="text-sm text-grey-text">
            <template v-if="requestReference">
              You are about to reject request
              <span class="font-semibold text-grey-900">{{ requestReference }}</span>.
              Please enter the reason why you are rejecting it.
            </template>
            <template v-else>
              You are about to reject this order request. Please enter the reason why you are rejecting it.
            </template>
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody class="space-y-3">
        <label class="block text-sm font-medium text-grey-900">Reason for rejection</label>
        <textarea
          v-model="reason"
          rows="4"
          class="w-full rounded-[12px] border border-border-input-default bg-background-on-canvas px-4 py-3 text-sm outline-none transition focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12"
          placeholder="Tell the requester why this request is being rejected"
        />
      </DrawerBody>

      <DrawerFooter class="gap-3 border-t border-grey-50">
        <Button variant="neutral" size="medium" class="w-full" :disabled="loading" @click="close">
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="medium"
          class="w-full"
          :loading="loading"
          :disabled="!canSubmit"
          @click="submit"
        >
          Reject request
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="open = $event">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle>Reject order request</DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody class="space-y-4">
        <DialogDescription class="text-sm text-grey-700">
          <template v-if="requestReference">
            You are about to reject request
            <span class="font-semibold text-grey-900">{{ requestReference }}</span>.
            Please enter the reason why you are rejecting it.
          </template>
          <template v-else>
            You are about to reject this order request. Please enter the reason why you are rejecting it.
          </template>
        </DialogDescription>
        <div>
          <label class="mb-2 block text-sm font-medium text-grey-900">Reason for rejection</label>
          <textarea
            v-model="reason"
            rows="4"
            class="w-full rounded-[12px] border border-border-input-default bg-background-on-canvas px-4 py-3 text-sm outline-none transition focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12"
            placeholder="Tell the requester why this request is being rejected"
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" size="medium" :disabled="loading" @click="close">
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="medium"
          :loading="loading"
          :disabled="!canSubmit"
          @click="submit"
        >
          Reject request
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
