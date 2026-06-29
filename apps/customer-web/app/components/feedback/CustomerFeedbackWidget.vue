<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from '@gosource/ui';
import { Check, ChevronDown, MessageSquarePlus } from 'lucide-vue-next';
import { extractApiErrorMessage } from '~/utils/api-error';
import {
  CUSTOMER_FLOATING_CONTENT_Z,
  CUSTOMER_FLOATING_OVERLAY_Z,
} from '~/lib/customer-overlay-z';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'bug', label: 'Report a bug' },
  { value: 'feature', label: 'Feature request' },
  { value: 'other', label: 'Other' },
] as const;

const route = useRoute();

const open = ref(false);
const submitting = ref(false);
const message = ref('');
const category = ref<string>('general');

const canSubmit = computed(() => message.value.trim().length > 0);
const selectedCategoryLabel = computed(
  () => CATEGORIES.find((option) => option.value === category.value)?.label ?? '',
);

function resetForm() {
  message.value = '';
  category.value = 'general';
}

function onOpenChange(value: boolean) {
  if (submitting.value) return; // don't dismiss mid-submit
  open.value = value;
  if (!value) resetForm();
}

async function submit() {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: {
        message: message.value.trim(),
        category: category.value,
        page: route.fullPath,
      },
    });
    toast.success('Thanks for your feedback! 🙌');
    open.value = false;
    resetForm();
  } catch (error) {
    toast.error(
      extractApiErrorMessage(error) ??
        'Could not send your feedback. Please try again.',
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex size-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary-500 text-white shadow-[0_20px_48px_-16px_rgba(11,61,18,0.5)] transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
    aria-label="Send feedback"
    @click="open = true"
  >
    <MessageSquarePlus class="size-6" aria-hidden="true" />
  </button>

  <Dialog :open="open" @update:open="onOpenChange">
      <DialogContent
        :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z"
        :class="`${CUSTOMER_FLOATING_CONTENT_Z} max-w-md`"
      >
        <DialogHeader>
          <DialogTitle>Share your feedback</DialogTitle>
          <DialogClose :disabled="submitting" />
        </DialogHeader>

        <DialogBody class="space-y-4">
          <p class="text-sm text-grey-600">
            Tell us what's working, what isn't, or what you'd love to see.
          </p>

          <div class="space-y-2">
            <span class="text-sm font-medium text-grey-900">Category</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child :disabled="submitting">
                <button
                  type="button"
                  class="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-border-input-default bg-background-on-canvas px-3 text-left text-sm text-grey-900 outline-none transition focus:border-border-input-active data-[state=open]:border-border-input-active disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{{ selectedCategoryLabel }}</span>
                  <ChevronDown class="size-4 shrink-0 text-grey-300" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                class="z-[130] w-[var(--reka-dropdown-menu-trigger-width)]"
              >
                <DropdownMenuItem
                  v-for="opt in CATEGORIES"
                  :key="opt.value"
                  @select="category = opt.value"
                >
                  <div class="flex w-full items-center justify-between gap-3">
                    <span>{{ opt.label }}</span>
                    <Check
                      v-if="category === opt.value"
                      class="size-4 text-primary-500"
                    />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div class="space-y-2">
            <label for="feedback-message" class="text-sm font-medium text-grey-900">
              Message
            </label>
            <textarea
              id="feedback-message"
              v-model="message"
              :disabled="submitting"
              rows="4"
              maxlength="2000"
              placeholder="Share the details…"
              class="w-full resize-none rounded-xl border border-grey-50 bg-background-on-canvas px-3 py-2.5 text-sm text-grey-900 outline-none focus:border-primary-400 disabled:opacity-60"
            />
          </div>
        </DialogBody>

        <DialogFooter class="gap-3">
          <Button
            variant="neutral"
            size="medium"
            :disabled="submitting"
            @click="onOpenChange(false)"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="medium"
            :disabled="!canSubmit || submitting"
            :loading="submitting"
            @click="submit"
          >
            Send feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
</template>
