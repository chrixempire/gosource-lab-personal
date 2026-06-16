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

export type CustomerAccountActionMode =
  | 'resetPassword'
  | 'activate'
  | 'deactivate'
  | 'delete';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  mode: CustomerAccountActionMode;
  customerName?: string;
  customerEmail?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{ confirm: [] }>();

const copy = computed(() => {
  const label = props.customerName?.trim() || 'This customer';

  switch (props.mode) {
    case 'resetPassword':
      return {
        title: 'Reset password',
        description: `Confirm you would like to send a reset link to this user's email address.`,
        email: props.customerEmail?.trim() || null,
        confirmLabel: 'Send reset link',
        destructive: false,
      };
    case 'activate':
      return {
        title: 'Activate account',
        description: `${label} will be activated and able to access their account again.`,
        email: null,
        confirmLabel: 'Activate',
        destructive: false,
      };
    case 'deactivate':
      return {
        title: 'Deactivate account',
        description: `${label} will be deactivated and unable to access their account.`,
        email: null,
        confirmLabel: 'Deactivate',
        destructive: true,
      };
    case 'delete':
      return {
        title: 'Delete account',
        description: `This action cannot be undone. ${label}'s account will be permanently deleted.`,
        email: null,
        confirmLabel: 'Delete account',
        destructive: true,
      };
    default:
      return {
        title: 'Confirm',
        description: 'Are you sure you want to continue?',
        email: null,
        confirmLabel: 'Confirm',
        destructive: false,
      };
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,440px)]">
      <DialogHeader>
        <DialogTitle class="!text-base !font-semibold !tracking-normal">{{ copy.title }}</DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody>
        <div class="space-y-3">
          <p class="text-sm text-grey-700">{{ copy.description }}</p>
          <div
            v-if="copy.email"
            class="rounded-xl border border-grey-50 bg-grey-55 px-3 py-2 text-sm font-medium text-grey-800"
          >
            {{ copy.email }}
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" size="medium" @click="open = false">Cancel</Button>
        <Button
          type="button"
          size="medium"
          :variant="copy.destructive ? 'destructive' : 'primary'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ copy.confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
