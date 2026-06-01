<script setup lang="ts">
import ListActionsMenu from '~/components/lists/ListActionsMenu.vue';
import ListCoverImage from '~/components/lists/ListCoverImage.vue';
import type { ShoppingListListItem } from '~/lib/shopping-list';
import { formatShoppingListCurrency, formatShoppingListDate } from '~/lib/shopping-list';

defineProps<{
  lists: ShoppingListListItem[];
  loading?: boolean;
  showBranchName?: boolean;
}>();

const emit = defineEmits<{
  rowClick: [list: ShoppingListListItem];
  view: [list: ShoppingListListItem];
  move: [list: ShoppingListListItem];
  edit: [list: ShoppingListListItem];
  delete: [list: ShoppingListListItem];
}>();
</script>

<template>
  <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="index in 6"
      :key="index"
      class="h-[7.5rem] animate-pulse rounded-[16px] bg-grey-55"
    />
  </div>

  <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <article
      v-for="list in lists"
      :key="list.id"
      class="cursor-pointer rounded-[16px] border border-grey-50 bg-background-on-canvas p-4 shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50/30"
      @click="emit('rowClick', list)"
    >
      <div class="flex items-start gap-3">
        <ListCoverImage
          :src="list.coverImageUrl"
          :alt="list.name"
          size="md"
        />

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate font-semibold text-grey-900">{{ list.name }}</p>
              <p v-if="showBranchName" class="mt-0.5 truncate text-xs font-medium text-primary-600">
                {{ list.branchName }}
              </p>
              <p v-if="list.description" class="mt-0.5 line-clamp-2 text-xs text-grey-300">
                {{ list.description }}
              </p>
            </div>
            <div class="shrink-0" @click.stop>
              <ListActionsMenu
                @view="emit('view', list)"
                @move="emit('move', list)"
                @edit="emit('edit', list)"
                @delete="emit('delete', list)"
              />
            </div>
          </div>

          <dl class="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <dt class="text-grey-300">Items</dt>
              <dd class="font-medium text-grey-900">{{ list.itemCount }}</dd>
            </div>
            <div>
              <dt class="text-grey-300">Amount</dt>
              <dd class="font-medium text-grey-900">{{ formatShoppingListCurrency(list.amount) }}</dd>
            </div>
            <div>
              <dt class="text-grey-300">Updated</dt>
              <dd class="font-medium text-grey-900">{{ formatShoppingListDate(list.updatedAt) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  </div>
</template>
