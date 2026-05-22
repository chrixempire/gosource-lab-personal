<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { MoreHorizontal } from 'lucide-vue-next';
import type { AdminUserListItem } from '~/types/settings';

defineProps<{
  user: AdminUserListItem;
  loading?: boolean;
}>();

const emit = defineEmits<{
  edit: [];
  activate: [];
  suspend: [];
  resend: [];
}>();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="!size-8"
        :disabled="loading"
        aria-label="User actions"
      >
        <MoreHorizontal class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuItem @select="emit('edit')">Edit user</DropdownMenuItem>
      <DropdownMenuItem
        v-if="user.status === 'inactive'"
        @select="emit('resend')"
      >
        Resend invite
      </DropdownMenuItem>
      <DropdownMenuItem
        v-else-if="user.status === 'active'"
        class="text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500!"
        @select="emit('suspend')"
      >
        Suspend user
      </DropdownMenuItem>
      <DropdownMenuItem
        v-else-if="user.status === 'suspended'"
        @select="emit('activate')"
      >
        Activate user
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
