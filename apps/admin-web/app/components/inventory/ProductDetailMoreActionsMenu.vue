<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { ChevronDown, PackageCheck, PackageMinus, PackagePlus, PackageX, Power } from 'lucide-vue-next';

defineProps<{
  inStock: boolean;
  active: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  addStock: [];
  removeStock: [];
  markInStock: [];
  markOutOfStock: [];
  activate: [];
  deactivate: [];
}>();

const destructiveItemClass =
  'gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!';
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0"
        :right-icon="ChevronDown"
        :disabled="disabled"
      >
        More actions
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-52">
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
        v-if="!inStock"
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
        v-if="!active"
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
</template>
