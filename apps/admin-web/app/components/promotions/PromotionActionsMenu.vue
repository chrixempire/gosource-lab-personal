<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Ellipsis } from 'lucide-vue-next';
import type { AdminPromotionListItem } from '~/types/promotions';

const props = defineProps<{ promotion: AdminPromotionListItem; disabled?: boolean }>();
const emit = defineEmits<{
  edit: [];
  duplicate: [];
  activate: [];
  deactivate: [];
  delete: [];
}>();

const destructiveItemClass =
  'gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!';

const options = computed(() => {
  const status = props.promotion.status;
  const base = [
    { key: 'edit', label: 'Edit promotion' },
    { key: 'duplicate', label: 'Duplicate promotion' },
  ];

  const tail = [{ key: 'delete', label: 'Delete promotion', danger: true }];

  if (status === 'active') {
    return [...base, { key: 'deactivate', label: 'Deactivate promotion', danger: true }, ...tail];
  }
  if (status === 'deactivated') {
    return [...base, { key: 'activate', label: 'Reactivate promotion' }, ...tail];
  }
  return [...base, ...tail];
});

function onSelect(key: string) {
  if (key === 'edit') emit('edit');
  if (key === 'duplicate') emit('duplicate');
  if (key === 'activate') emit('activate');
  if (key === 'deactivate') emit('deactivate');
  if (key === 'delete') emit('delete');
}
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
          aria-label="Promotion actions"
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-52">
        <DropdownMenuItem
          v-for="option in options"
          :key="option.key"
          :class="option.danger ? destructiveItemClass : undefined"
          @select="onSelect(option.key)"
        >
          {{ option.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
