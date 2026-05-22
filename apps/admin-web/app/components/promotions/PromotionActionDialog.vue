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
import type { PromotionActionMode } from '~/types/promotions';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  mode: PromotionActionMode;
  promotionName?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{ confirm: [] }>();

const copy = computed(() => {
  const name = props.promotionName ? ` “${props.promotionName}”` : '';
  switch (props.mode) {
    case 'delete':
      return {
        title: 'Delete promotion',
        body: `Are you sure you want to delete${name}? This cannot be undone.`,
        confirm: 'Delete',
        destructive: true,
      };
    case 'duplicate':
      return {
        title: 'Duplicate promotion',
        body: `Create a copy of${name || ' this promotion'}? The copy starts inactive.`,
        confirm: 'Duplicate',
        destructive: false,
      };
    case 'activate':
      return {
        title: 'Reactivate promotion',
        body: `Reactivate${name} so it can run on the storefront again?`,
        confirm: 'Reactivate',
        destructive: false,
      };
    case 'deactivate':
      return {
        title: 'Deactivate promotion',
        body: `Deactivate${name}? Products will stop showing this promotion until reactivated.`,
        confirm: 'Deactivate',
        destructive: true,
      };
    default:
      return { title: '', body: '', confirm: 'Confirm', destructive: false };
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle class="!text-base">{{ copy.title }}</DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-700">{{ copy.body }}</p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" @click="open = false">Cancel</Button>
        <Button
          type="button"
          :variant="copy.destructive ? 'destructive' : 'primary'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ copy.confirm }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
