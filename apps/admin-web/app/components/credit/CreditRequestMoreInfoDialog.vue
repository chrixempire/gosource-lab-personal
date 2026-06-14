<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@gosource/ui';
import { ADMIN_MODAL_TITLE_CLASS } from '~/lib/admin-dialog';

/** Reference drawer — no legacy API; matches reference UX until workflow API exists. */
const open = defineModel<boolean>('open', { default: false });

const title = ref('');
const description = ref('');

watch(open, (value) => {
  if (!value) {
    title.value = '';
    description.value = '';
  }
});

function onSubmit() {
  if (!title.value.trim() || !description.value.trim()) return;
  open.value = false;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">Request more information</DialogTitle>
      </DialogHeader>
      <DialogBody class="space-y-4">
        <p class="text-sm text-grey-600">
          Specify the additional documents required to complete the credit application. The business
          will be notified and asked to upload them.
        </p>
        <Input v-model="title" label="Title" placeholder="Additional documents required" />
        <label class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Description</span>
          <textarea
            v-model="description"
            class="min-h-[120px] w-full rounded-lg border border-grey-50 p-3 text-sm"
            placeholder="List documents or details needed from the business"
          />
        </label>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="medium" @click="open = false">Cancel</Button>
        <Button type="button" variant="primary" size="medium" @click="onSubmit">Send request</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
