<script setup lang="ts">
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@gosource/ui';
import { Ellipsis, Eye, Pencil, Trash2 } from 'lucide-vue-next';
import type { AdminCategoryListItem } from '~/types/inventory';

defineProps<{
  category: AdminCategoryListItem;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  view: [];
  edit: [];
  delete: [];
}>();

const destructiveItemClass =
  'gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!';
</script>

<template>
  <div class="shrink-0" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          size="icon"
          variant="ghost"
          class="!size-9 !rounded-full !border !border-grey-50 !bg-white !p-0"
          :disabled="disabled"
          aria-label="Category actions"
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuItem class="gap-2.5" @select="emit('view')">
          <Eye class="size-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem class="gap-2.5" @select="emit('edit')">
          <Pencil class="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem :class="destructiveItemClass" @select="emit('delete')">
          <Trash2 class="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
