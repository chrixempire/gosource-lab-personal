<script setup lang="ts">
import type { BranchMemberRecord } from '@gosource/api-client';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@gosource/ui';
import { Ellipsis, Eye, Link2, Mail, Pencil, Power, Trash2, UserX } from 'lucide-vue-next';

const props = defineProps<{
  member: BranchMemberRecord;
  hidden?: boolean;
}>();

const emit = defineEmits<{
  viewDetails: [];
  edit: [];
  deactivate: [];
  activate: [];
  deleteMember: [];
  deleteInvite: [];
  resendInvite: [];
  refreshInvite: [];
}>();

const isInvite = computed(() => props.member.kind === 'invite');
const isInactive = computed(() => props.member.kind === 'member' && props.member.status === 'inactive');
</script>

<template>
  <div v-if="!hidden" class="shrink-0" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button size="icon" variant="ghost" class="!size-9 !rounded-full !border !border-grey-50 !bg-background-on-canvas !p-0">
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-52">
        <template v-if="isInvite">
          <DropdownMenuItem class="gap-2.5" @select="emit('resendInvite')">
            <Mail class="size-4" />
            Resend invite
          </DropdownMenuItem>
          <DropdownMenuItem class="gap-2.5" @select="emit('refreshInvite')">
            <Link2 class="size-4" />
            Refresh invite link
          </DropdownMenuItem>
          <DropdownMenuItem
            class="gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!"
            @select="emit('deleteInvite')"
          >
            <Trash2 class="size-4" />
            Delete invite
          </DropdownMenuItem>
        </template>

        <template v-else>
          <DropdownMenuItem class="gap-2.5" @select="emit('viewDetails')">
            <Eye class="size-4" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem class="gap-2.5" @select="emit('edit')">
            <Pencil class="size-4" />
            Edit member
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="!isInactive"
            class="gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!"
            @select="emit('deactivate')"
          >
            <Power class="size-4" />
            Deactivate
          </DropdownMenuItem>
          <DropdownMenuItem v-else class="gap-2.5" @select="emit('activate')">
            <Power class="size-4" />
            Activate
          </DropdownMenuItem>
          <DropdownMenuItem
            class="gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!"
            @select="emit('deleteMember')"
          >
            <UserX class="size-4" />
            Delete member
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
