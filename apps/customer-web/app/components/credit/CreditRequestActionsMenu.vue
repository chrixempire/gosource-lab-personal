<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Ellipsis, Eye, RotateCcw, X } from 'lucide-vue-next';

defineProps<{
  canCancel?: boolean;
  canReapply?: boolean;
}>();

const emit = defineEmits<{
  viewDetails: [];
  cancel: [];
  reapply: [];
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
          class="!size-9 !rounded-full !border !border-grey-50 !bg-background-on-canvas !p-0"
          aria-label="Credit request actions"
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-56">
        <DropdownMenuItem class="gap-2.5" @select="emit('viewDetails')">
          <Eye class="size-4" />
          View details
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="canCancel"
          :class="destructiveItemClass"
          @select="emit('cancel')"
        >
          <X class="size-4" />
          Cancel
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="canReapply"
          class="gap-2.5"
          @select="emit('reapply')"
        >
          <RotateCcw class="size-4" />
          Reapply
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
