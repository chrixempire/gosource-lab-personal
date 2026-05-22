<script setup lang="ts">
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@gosource/ui';
import { Ellipsis, Eye, PackageCheck, PackageMinus, PackagePlus, PackageX, Pencil, Power } from 'lucide-vue-next';
import type { AdminProductListItem } from '~/types/inventory';

defineProps<{
  product: AdminProductListItem;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  viewDetails: [];
  addStock: [];
  removeStock: [];
  markInStock: [];
  markOutOfStock: [];
  edit: [];
  activate: [];
  deactivate: [];
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
          aria-label="Item actions"
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-52">
        <DropdownMenuItem class="gap-2.5" @select="emit('viewDetails')">
          <Eye class="size-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem class="gap-2.5" @select="emit('edit')">
          <Pencil class="size-4" />
          Edit item
        </DropdownMenuItem>
        <DropdownMenuItem class="gap-2.5" @select="emit('addStock')">
          <PackagePlus class="size-4" />
          Add stock
        </DropdownMenuItem>
        <DropdownMenuItem
          :class="destructiveItemClass"
          @select="emit('removeStock')"
        >
          <PackageMinus class="size-4" />
          Remove stock
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="!product.inStock"
          class="gap-2.5"
          @select="emit('markInStock')"
        >
          <PackageCheck class="size-4" />
          Mark as in stock
        </DropdownMenuItem>
        <DropdownMenuItem
          v-else
          :class="destructiveItemClass"
          @select="emit('markOutOfStock')"
        >
          <PackageX class="size-4" />
          Mark as out of stock
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="!product.active"
          class="gap-2.5"
          @select="emit('activate')"
        >
          <Power class="size-4" />
          Activate
        </DropdownMenuItem>
        <DropdownMenuItem
          v-else
          :class="destructiveItemClass"
          @select="emit('deactivate')"
        >
          <Power class="size-4" />
          Deactivate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
