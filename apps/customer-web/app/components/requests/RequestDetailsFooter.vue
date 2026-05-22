<script setup lang="ts">
import { Button } from '@gosource/ui';

defineProps<{
  canApproveOrReject?: boolean;
  canCancel?: boolean;
  canAddMore?: boolean;
  canReopen?: boolean;
  isRejecting?: boolean;
  confirmLoading?: boolean;
  canSubmitReject?: boolean;
  reopenLoading?: boolean;
}>();

const emit = defineEmits<{
  approve: [];
  reject: [];
  cancel: [];
  addMore: [];
  reopen: [];
  back: [];
  submitReject: [];
}>();
</script>

<template>
  <div
    v-if="!isRejecting"
    class="flex w-full flex-wrap items-center justify-end gap-3"
  >
    <Button
      v-if="canReopen"
      variant="neutral"
      size="medium"
      class="!w-auto min-w-[9rem]"
      :loading="reopenLoading"
      @click="emit('reopen')"
    >
      Edit order request
    </Button>
    <Button
      v-if="canAddMore"
      variant="neutral"
      size="medium"
      class="!w-auto min-w-[9rem]"
      @click="emit('addMore')"
    >
      Add more items
    </Button>
    <Button
      v-if="canApproveOrReject"
      variant="primary"
      size="medium"
      class="!w-auto min-w-[9rem]"
      @click="emit('approve')"
    >
      Checkout
    </Button>
    <Button
      v-if="canApproveOrReject"
      variant="destructive"
      size="medium"
      class="!w-auto min-w-[9rem]"
      @click="emit('reject')"
    >
      Reject request
    </Button>
    <Button
      v-if="canCancel"
      variant="destructive"
      size="medium"
      class="!w-auto min-w-[9rem]"
      @click="emit('cancel')"
    >
      Cancel request
    </Button>
  </div>

  <div
    v-else
    class="flex w-full flex-wrap items-center justify-end gap-3"
  >
    <Button
      variant="neutral"
      size="medium"
      class="!w-auto min-w-[9rem]"
      :disabled="confirmLoading"
      @click="emit('back')"
    >
      Back
    </Button>
    <Button
      variant="destructive"
      size="medium"
      class="!w-auto min-w-[9rem]"
      :loading="confirmLoading"
      :disabled="!canSubmitReject"
      @click="emit('submitReject')"
    >
      Reject request
    </Button>
  </div>
</template>
