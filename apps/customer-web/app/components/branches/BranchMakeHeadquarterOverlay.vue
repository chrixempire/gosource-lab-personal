<script setup lang="ts">
import type { BranchRecord } from '@gosource/api-client';
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
  toast,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import {
  CUSTOMER_FLOATING_CONTENT_Z,
  CUSTOMER_FLOATING_OVERLAY_Z,
} from '~/lib/customer-overlay-z';
import { useCustomerBranchService } from '~/services/branch.service';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

const props = defineProps<{
  open: boolean;
  branch: BranchRecord | null;
}>();

const emit = defineEmits<{
  updated: [branch: BranchRecord];
  'update:open': [value: boolean];
}>();

const { makeBranchHeadquarter } = useCustomerBranchService();
const isMobile = useMediaQuery('(max-width: 600px)');
const loading = ref(false);
const errorMessage = ref('');

function close() {
  emit('update:open', false);
}

async function submit() {
  if (!props.branch) {
    return;
  }

  const branchId = String(props.branch.id ?? '').trim();
  if (!branchId) {
    errorMessage.value = 'This branch is missing its identifier. Refresh and try again.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await makeBranchHeadquarter(branchId);
    if (!response.data) {
      throw new Error('Unable to update headquarter right now');
    }

    toast.success(extractApiResponseMessage(response, 'Branch is now headquarter'));
    emit('updated', response.data);
    close();
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to update headquarter right now');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (nextOpen) => {
    if (nextOpen) {
      errorMessage.value = '';
    }
  },
);
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z" :class="CUSTOMER_FLOATING_CONTENT_Z">
      <DrawerHeader class="text-left">
        <DrawerTitle>Make branch headquarter</DrawerTitle>
        <DrawerDescription>
          You are about to make
          <span class="font-semibold text-grey-900">{{ branch?.branchName ?? 'this branch' }}</span>
          your headquarter branch.
        </DrawerDescription>
      </DrawerHeader>

      <DrawerBody class="px-4 pb-2">
        <p class="text-sm text-grey-700">
          The current headquarter branch will be replaced. This affects how your business is represented
          across the app.
        </p>
        <p v-if="errorMessage" class="mt-3 text-sm text-negative-500">
          {{ errorMessage }}
        </p>
      </DrawerBody>

      <DrawerFooter class="gap-3 border-t border-grey-50">
        <Button type="button" variant="secondary" size="medium" class="flex-1" @click="close">
          Cancel
        </Button>
        <Button type="button" variant="primary" size="medium" class="flex-1" :loading="loading" @click="submit">
          Make headquarter
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle>Make branch headquarter</DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody class="space-y-3">
        <DialogDescription class="text-sm text-grey-700">
          You are about to make
          <span class="font-semibold text-grey-900">{{ branch?.branchName ?? 'this branch' }}</span>
          your headquarter branch. The current headquarter branch will be replaced.
        </DialogDescription>
        <p v-if="errorMessage" class="text-sm text-negative-500">
          {{ errorMessage }}
        </p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" size="medium" @click="close">Cancel</Button>
        <Button type="button" variant="primary" size="medium" :loading="loading" @click="submit">
          Make headquarter
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
