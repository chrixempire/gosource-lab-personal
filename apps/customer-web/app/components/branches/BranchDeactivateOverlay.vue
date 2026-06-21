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
  deactivated: [branch: BranchRecord];
  'update:open': [value: boolean];
}>();

const { activateBranch, deactivateBranch } = useCustomerBranchService();
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
    const result = props.branch.isDeactivated
      ? await activateBranch(branchId)
      : await deactivateBranch(branchId);

    if (result.data) {
      emit('deactivated', result.data);
    }

    toast.success(extractApiResponseMessage(result, 'Branch status updated'));

    close();
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(
      error,
      props.branch?.isDeactivated ? 'Unable to activate branch right now' : 'Unable to deactivate branch right now',
    );
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent
      :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z"
      :class="`max-h-[92vh] ${CUSTOMER_FLOATING_CONTENT_Z}`"
    >
      <DrawerHeader>
        <div class="flex flex-col gap-1">
          <DrawerTitle>
            {{ branch?.isDeactivated ? 'Activate branch' : 'Deactivate branch' }}
          </DrawerTitle>
          <DrawerDescription class="text-[12px] leading-5 text-grey-text">
            Review this action carefully before continuing.
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody class="space-y-3">
        <p class="text-sm leading-6 text-grey-text">
          Are you sure you want to {{ branch?.isDeactivated ? 'activate' : 'deactivate' }}
          <span class="font-semibold text-grey-900">{{ branch?.branchName }}</span>?
        </p>
        <p class="text-sm leading-6 text-grey-text">
          {{
            branch?.isDeactivated
              ? 'This branch will become available again for branch-specific workflows once activated.'
              : 'Members associated with this branch may lose access to branch-specific workflows until it is restored.'
          }}
        </p>
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
          :variant="branch?.isDeactivated ? 'primary' : 'destructive'"
          size="medium"
          class="w-full"
          :loading="loading"
          @click="submit"
        >
          {{ branch?.isDeactivated ? 'Activate' : 'Deactivate' }}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z" :class="CUSTOMER_FLOATING_CONTENT_Z">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            {{ branch?.isDeactivated ? 'Activate branch' : 'Deactivate branch' }}
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Review this action carefully before continuing.
          </DialogDescription>
        </div>

        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="space-y-3">
        <p class="text-sm leading-6 text-grey-text">
          Are you sure you want to {{ branch?.isDeactivated ? 'activate' : 'deactivate' }}
          <span class="font-semibold text-grey-900">{{ branch?.branchName }}</span>?
        </p>
        <p class="text-sm leading-6 text-grey-text">
          {{
            branch?.isDeactivated
              ? 'This branch will become available again for branch-specific workflows once activated.'
              : 'Members associated with this branch may lose access to branch-specific workflows until it is restored.'
          }}
        </p>
        <p
          v-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
      </DialogBody>

      <DialogFooter class="gap-3 [&>*]:min-w-0">
        <Button variant="neutral" size="medium" class="w-full" :disabled="loading" @click="close">
          Cancel
        </Button>
        <Button
          :variant="branch?.isDeactivated ? 'primary' : 'destructive'"
          size="medium"
          class="w-full"
          :loading="loading"
          @click="submit"
        >
          {{ branch?.isDeactivated ? 'Activate' : 'Deactivate' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
