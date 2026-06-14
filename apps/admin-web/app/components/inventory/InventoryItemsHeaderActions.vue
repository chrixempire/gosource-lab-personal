<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Plus } from 'lucide-vue-next';
import InventoryItemsMoreActionsMenu from '~/components/inventory/InventoryItemsMoreActionsMenu.vue';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
</script>

<template>
  <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
    <InventoryItemsMoreActionsMenu />
    <Button
      type="button"
      size="small"
      class="!w-fit shrink-0"
      :left-icon="Plus"
      @click="navigateTo(ADMIN_PAGE_ROUTES.INVENTORY_ITEM_CREATE)"
    >
      Add item
    </Button>
  </div>
</template>
