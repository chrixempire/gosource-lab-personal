<script setup lang="ts">
import type { BranchRecord, ShoppingListRecord } from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import BranchPickerDropdown from '~/components/branches/BranchPickerDropdown.vue';

const props = defineProps<{
  open: boolean;
  list?: ShoppingListRecord | null;
  submitting?: boolean;
  showBranchPicker?: boolean;
  branches?: BranchRecord[];
  branchesLoading?: boolean;
  defaultBranchId?: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  submit: [payload: { name: string; description: string; branchId: string }];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');
const name = ref('');
const description = ref('');
const branchId = ref('');

const isEdit = computed(() => Boolean(props.list?.id));
const title = computed(() => (isEdit.value ? 'Edit list' : 'Create list'));
const submitLabel = computed(() => (isEdit.value ? 'Save changes' : 'Create list'));
const canSubmit = computed(() => {
  if (!name.value.trim()) {
    return false;
  }

  if (props.showBranchPicker && !isEdit.value && !branchId.value) {
    return false;
  }

  return true;
});

watch(
  () => [props.open, props.list, props.defaultBranchId] as const,
  ([open, list, defaultBranchId]) => {
    if (!open) {
      return;
    }

    name.value = list?.name ?? '';
    description.value = list?.description ?? '';
    branchId.value = list?.branchId ?? defaultBranchId ?? '';
  },
  { immediate: true },
);

function handleOpenChange(value: boolean) {
  emit('update:open', value);
}

function handleSubmit() {
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    return;
  }

  const resolvedBranchId = isEdit.value
    ? props.list?.branchId ?? branchId.value
    : branchId.value;

  if (!resolvedBranchId) {
    return;
  }

  emit('submit', {
    name: trimmedName,
    description: description.value.trim(),
    branchId: resolvedBranchId,
  });
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="handleOpenChange">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <DrawerTitle>{{ title }}</DrawerTitle>
      </DrawerHeader>

      <DrawerBody class="space-y-4">
        <BranchPickerDropdown
          v-if="showBranchPicker && !isEdit"
          v-model="branchId"
          :branches="branches ?? []"
          :loading="branchesLoading"
          :disabled="submitting"
        />
        <div class="space-y-2">
          <label for="list-name-mobile" class="text-sm font-medium text-grey-900">List name</label>
          <Input
            id="list-name-mobile"
            v-model="name"
            placeholder="e.g. Weekly restock"
            :disabled="submitting"
          />
        </div>
        <div class="space-y-2">
          <label for="list-description-mobile" class="text-sm font-medium text-grey-900">Description (optional)</label>
          <Input
            id="list-description-mobile"
            v-model="description"
            placeholder="Short note for your team"
            :disabled="submitting"
          />
        </div>
      </DrawerBody>

      <DrawerFooter class="gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="submitting" @click="handleOpenChange(false)">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="medium"
          class="w-full"
          :disabled="submitting || !canSubmit"
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ submitLabel }}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogClose />
      </DialogHeader>

      <DialogBody class="space-y-4">
        <BranchPickerDropdown
          v-if="showBranchPicker && !isEdit"
          v-model="branchId"
          :branches="branches ?? []"
          :loading="branchesLoading"
          :disabled="submitting"
        />
        <div class="space-y-2">
          <label for="list-name" class="text-sm font-medium text-grey-900">List name</label>
          <Input
            id="list-name"
            v-model="name"
            placeholder="e.g. Weekly restock"
            :disabled="submitting"
          />
        </div>
        <div class="space-y-2">
          <label for="list-description" class="text-sm font-medium text-grey-900">Description (optional)</label>
          <Input
            id="list-description"
            v-model="description"
            placeholder="Short note for your team"
            :disabled="submitting"
          />
        </div>
      </DialogBody>

      <DialogFooter class="gap-3">
        <Button variant="neutral" size="medium" :disabled="submitting" @click="handleOpenChange(false)">
          Cancel
        </Button>
        <Button
          variant="primary"
          size="medium"
          :disabled="submitting || !canSubmit"
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ submitLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
