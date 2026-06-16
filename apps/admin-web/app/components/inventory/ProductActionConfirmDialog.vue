<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@gosource/ui';
import {
  PRODUCT_ACTION_COPY,
  type ProductActionType,
} from '~/lib/product-action-copy';
import { ADMIN_MODAL_TITLE_CLASS } from '~/lib/admin-dialog';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  action: ProductActionType | null;
  productName?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
}>();

const copy = computed(() =>
  props.action ? PRODUCT_ACTION_COPY[props.action] : null,
);
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,480px)]">
      <DialogHeader>
        <DialogTitle :class="['min-w-0 flex-1 pr-2', ADMIN_MODAL_TITLE_CLASS]">
          {{ copy?.title ?? 'Confirm action' }}
        </DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody>
        <p class="text-sm leading-6 text-grey-600">
          {{ copy?.description }}
        </p>
        <p v-if="productName" class="mt-3 text-sm font-medium text-grey-900">
          {{ productName }}
        </p>
      </DialogBody>

      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="medium" @click="open = false">
          Cancel
        </Button>
        <Button
          type="button"
          size="medium"
          :variant="copy?.destructive ? 'destructive' : 'default'"
          :loading="loading"
          :disabled="!action"
          @click="emit('confirm')"
        >
          {{ copy?.confirmLabel ?? 'Confirm' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
