<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@gosource/ui';
import { ADMIN_MODAL_TITLE_CLASS } from '~/lib/admin-dialog';
import type { AdminUserListItem } from '~/types/settings';

export type SettingsUserActionMode = 'activate' | 'suspend' | 'resend';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  mode: SettingsUserActionMode;
  user: AdminUserListItem | null;
  loading?: boolean;
}>();

const emit = defineEmits<{ confirm: [] }>();

const copy = computed(() => {
  const name = props.user
    ? [props.user.firstName, props.user.lastName].filter(Boolean).join(' ').trim() || props.user.email
    : 'This user';

  switch (props.mode) {
    case 'activate':
      return {
        title: 'Activate user',
        description: `${name} will be activated and able to access GoSource Admin again.`,
        confirmLabel: 'Activate',
        destructive: false,
      };
    case 'suspend':
      return {
        title: 'Suspend user',
        description: `${name} will be suspended and unable to access GoSource Admin.`,
        confirmLabel: 'Suspend',
        destructive: true,
      };
    case 'resend':
      return {
        title: 'Resend invite',
        description: `Send a new invite email to ${props.user?.email ?? 'this user'}.`,
        confirmLabel: 'Resend invite',
        destructive: false,
      };
    default:
      return {
        title: 'Confirm',
        description: '',
        confirmLabel: 'Confirm',
        destructive: false,
      };
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">{{ copy.title }}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-600">{{ copy.description }}</p>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="secondary" size="small" @click="open = false">
          Cancel
        </Button>
        <Button
          type="button"
          size="small"
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
