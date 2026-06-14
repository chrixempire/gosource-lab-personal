<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { BarChart3, ChevronDown, ClipboardList } from 'lucide-vue-next';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';

defineProps<{
  disabled?: boolean;
}>();
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
      <DropdownMenuItem
        class="gap-2.5"
        @select="navigateTo(ADMIN_PAGE_ROUTES.INVENTORY_REPORT)"
      >
        <BarChart3 class="size-4" />
        Inventory report
      </DropdownMenuItem>
      <DropdownMenuItem
        class="gap-2.5"
        @select="navigateTo(ADMIN_PAGE_ROUTES.INVENTORY_STORE_COUNT)"
      >
        <ClipboardList class="size-4" />
        Store count
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
