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
  Input,
  toast,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import { useCustomerBranchService } from '~/services/branch.service';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

const props = defineProps<{
  open: boolean;
  branch: BranchRecord | null;
}>();

const emit = defineEmits<{
  deleted: [branchId: string];
  'update:open': [value: boolean];
}>();

const { deleteBranch } = useCustomerBranchService();
const isMobile = useMediaQuery('(max-width: 600px)');
const loading = ref(false);
const errorMessage = ref('');
const confirmBranchName = ref('');

const expectedBranchName = computed(() => String(props.branch?.branchName ?? '').trim());

const branchNameMatches = computed(
  () =>
    expectedBranchName.value.length > 0 &&
    confirmBranchName.value.trim() === expectedBranchName.value,
);

watch(
  () => [props.open, props.branch?.id] as const,
  ([open]) => {
    if (!open) {
      confirmBranchName.value = '';
      errorMessage.value = '';
    }
  },
);

watch(branchNameMatches, (matches) => {
  if (matches) {
    errorMessage.value = '';
  }
});

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

  if (!branchNameMatches.value) {
    const message = `Type "${expectedBranchName.value}" exactly to confirm deletion.`;
    errorMessage.value = message;
    toast.error(message);
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await deleteBranch(branchId);
    emit('deleted', branchId);
    toast.success(extractApiResponseMessage(result, 'Branch deleted'));
    close();
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to delete branch right now');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <div class="flex flex-col gap-1">
          <DrawerTitle class="text-[24px] font-semibold text-grey-900">
            Delete branch
          </DrawerTitle>
          <DrawerDescription class="text-[12px] leading-5 text-grey-text">
            This action cannot be undone.
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody class="space-y-3">
        <p class="text-sm leading-6 text-grey-text">
          Are you sure you want to delete
          <span class="font-semibold text-grey-900">{{ branch?.branchName }}</span>?
        </p>
        <p class="text-sm leading-6 text-grey-text">
          This branch will be removed permanently if it has no members, pending invites, or headquarter status.
        </p>
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-grey-900">
            Type <span class="font-semibold">{{ expectedBranchName }}</span> to confirm
          </span>
          <Input
            v-model="confirmBranchName"
            :placeholder="expectedBranchName"
            :disabled="loading"
            autocomplete="off"
          />
        </label>
        <p
          v-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
      </DrawerBody>

      <DrawerFooter class="gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="loading" @click="close">
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="medium"
          class="w-full"
          :loading="loading"
          @click="submit"
        >
          Delete branch
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle class="text-[24px] font-semibold text-grey-900">
            Delete branch
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            This action cannot be undone.
          </DialogDescription>
        </div>

        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="space-y-3">
        <p class="text-sm leading-6 text-grey-text">
          Are you sure you want to delete
          <span class="font-semibold text-grey-900">{{ branch?.branchName }}</span>?
        </p>
        <p class="text-sm leading-6 text-grey-text">
          This branch will be removed permanently if it has no members, pending invites, or headquarter status.
        </p>
        <label class="grid gap-1.5">
          <span class="text-sm font-medium text-grey-900">
            Type <span class="font-semibold">{{ expectedBranchName }}</span> to confirm
          </span>
          <Input
            v-model="confirmBranchName"
            :placeholder="expectedBranchName"
            :disabled="loading"
            autocomplete="off"
          />
        </label>
        <p
          v-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
      </DialogBody>

      <DialogFooter class="grid grid-cols-2 gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="loading" @click="close">
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="medium"
          class="w-full"
          :loading="loading"
          @click="submit"
        >
          Delete branch
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
