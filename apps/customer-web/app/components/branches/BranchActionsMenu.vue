<script setup lang="ts">
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@gosource/ui';
import { Ellipsis, Eye, Landmark, Pencil, Power, Trash2, UserPlus } from 'lucide-vue-next';

defineProps<{
  isDeactivated?: boolean;
  isHeadquarter?: boolean;
  hidden?: boolean;
}>();

defineEmits<{
  view: [];
  invite: [];
  edit: [];
  makeHeadquarter: [];
  activate: [];
  deactivate: [];
  delete: [];
}>();
</script>

<template>
  <div v-if="!hidden" class="shrink-0" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button size="icon" variant="ghost" class="!size-9 !rounded-full !border !border-grey-50 !bg-background-on-canvas !p-0">
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-44">
        <DropdownMenuItem class="gap-2.5" @select="$emit('view')">
          <Eye class="size-4" />
          View branch
        </DropdownMenuItem>
        <DropdownMenuItem class="gap-2.5" @select="$emit('edit')">
          <Pencil class="size-4" />
          Edit branch
        </DropdownMenuItem>
        <DropdownMenuItem class="gap-2.5" @select="$emit('invite')">
          <UserPlus class="size-4" />
          Invite member
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="!isHeadquarter"
          class="gap-2.5"
          @select="$emit('makeHeadquarter')"
        >
          <Landmark class="size-4" />
          Make headquarter
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="!isDeactivated"
          class="gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!"
          @select="$emit('deactivate')"
        >
          <Power class="size-4" />
          Deactivate
        </DropdownMenuItem>
        <DropdownMenuItem
          v-else
          class="gap-2.5"
          @select="$emit('activate')"
        >
          <Power class="size-4" />
          Activate
        </DropdownMenuItem>
        <DropdownMenuItem class="gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!" @select="$emit('delete')">
          <Trash2 class="size-4" />
          Delete branch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
