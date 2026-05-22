<script setup lang="ts">
import type { ShoppingListRecord } from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  RadioGroup,
  RadioGroupItem,
} from '@gosource/ui';

const props = defineProps<{
  open: boolean;
  lists: ShoppingListRecord[];
  currentListId: string;
  selectedCount: number;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [targetListId: string];
}>();

const targetListId = ref('');

const targetOptions = computed(() =>
  props.lists.filter((list) => list.id !== props.currentListId),
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      targetListId.value = '';
      return;
    }

    targetListId.value = targetOptions.value[0]?.id ?? '';
  },
  { immediate: true },
);

function handleConfirm() {
  if (!targetListId.value) {
    return;
  }

  emit('confirm', targetListId.value);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Move items to another list</DialogTitle>
      </DialogHeader>

      <DialogBody class="space-y-4">
        <p class="text-sm text-grey-text">
          Move {{ selectedCount }} selected item{{ selectedCount === 1 ? '' : 's' }} to:
        </p>

        <RadioGroup
          v-if="targetOptions.length"
          v-model="targetListId"
          class="flex flex-col gap-2"
          :disabled="submitting"
        >
          <label
            v-for="list in targetOptions"
            :key="list.id"
            class="flex cursor-pointer items-center gap-3 rounded-[12px] border border-grey-50 px-3 py-2.5"
          >
            <RadioGroupItem :value="list.id" />
            <span class="text-sm font-medium text-grey-900">{{ list.name }}</span>
          </label>
        </RadioGroup>

        <p v-else class="text-xs text-grey-300">
          Create another list to move items into.
        </p>
      </DialogBody>

      <DialogFooter class="gap-3">
        <Button variant="neutral" :disabled="submitting" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button
          variant="primary"
          :disabled="submitting || !targetListId"
          :loading="submitting"
          @click="handleConfirm"
        >
          Move items
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
