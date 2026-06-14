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
import type { AdminRoleListItem } from '~/types/settings';

const open = defineModel<boolean>('open', { default: false });

defineProps<{
  role: AdminRoleListItem | null;
  loading?: boolean;
}>();

const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">Delete role</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-grey-600">
          Delete <span class="font-semibold text-grey-900">{{ role?.name }}</span>?
          Users assigned to this role may lose access until reassigned.
        </p>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="secondary" size="medium" @click="open = false">
          Cancel
        </Button>
        <Button type="button" variant="destructive" size="medium" :loading="loading" @click="emit('confirm')">
          Delete role
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
