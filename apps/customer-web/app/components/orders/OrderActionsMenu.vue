<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Ellipsis, Eye, LoaderCircle, ShoppingCart } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    reorderLoading?: boolean;
    isReordering?: boolean;
  }>(),
  {
    reorderLoading: false,
    isReordering: false,
  },
);

const emit = defineEmits<{
  viewDetails: [];
  reorder: [];
}>();
</script>

<template>
  <div class="shrink-0" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          size="icon"
          variant="ghost"
          class="!size-9 !rounded-full !border !border-grey-50 !bg-background-on-canvas !p-0"
          aria-label="Order actions"
          :disabled="isReordering"
        >
          <LoaderCircle
            v-if="isReordering"
            class="size-4 animate-spin"
          />
          <Ellipsis
            v-else
            class="size-4"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-56">
        <DropdownMenuItem class="gap-2.5" @select="emit('viewDetails')">
          <Eye class="size-4" />
          View details
        </DropdownMenuItem>

        <DropdownMenuItem
          class="gap-2.5"
          :disabled="reorderLoading"
          @select="emit('reorder')"
        >
          <ShoppingCart class="size-4" />
          Reorder products
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
