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
  toast,
} from '@gosource/ui';
import { extractApiErrorMessage } from '~/utils/api-error';
import {
  CUSTOMER_FLOATING_CONTENT_Z,
  CUSTOMER_FLOATING_OVERLAY_Z,
} from '~/lib/customer-overlay-z';

const props = defineProps<{
  open: boolean;
  orderId: string | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  // Fired once the review step is finished (skipped, dismissed, or submitted).
  done: [];
}>();

const RATINGS = [
  { value: 1, emoji: '😠', label: 'Very hard' },
  { value: 2, emoji: '🙁', label: 'Hard' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Easy' },
  { value: 5, emoji: '😍', label: 'Very easy' },
] as const;

const rating = ref(0);
const comment = ref('');
const submitting = ref(false);

const selectedLabel = computed(
  () => RATINGS.find((option) => option.value === rating.value)?.label ?? '',
);

function reset() {
  rating.value = 0;
  comment.value = '';
}

function markReviewed() {
  if (props.orderId && import.meta.client) {
    localStorage.setItem(`checkout-reviewed-${props.orderId}`, '1');
  }
}

// Finish the review step → parent shows the success modal next.
function finish() {
  markReviewed();
  emit('update:open', false);
  emit('done');
  reset();
}

function onOpenChange(value: boolean) {
  if (submitting.value) return;
  if (!value) finish(); // overlay click / Esc / close = skip
}

function skip() {
  if (submitting.value) return;
  finish();
}

async function submit() {
  if (!rating.value || submitting.value) return;
  submitting.value = true;
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: {
        orderId: props.orderId,
        rating: rating.value,
        comment: comment.value.trim() || undefined,
      },
    });
    finish();
  } catch (error) {
    toast.error(
      extractApiErrorMessage(error) ?? 'Could not submit your rating. Please try again.',
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent
      :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z"
      :class="`${CUSTOMER_FLOATING_CONTENT_Z} max-w-md`"
    >
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-0.5 pr-2 text-left">
          <DialogTitle class="!text-lg !font-semibold text-primary-700">
            Thank you for your order!
          </DialogTitle>
        </div>
        <DialogClose class="shrink-0" :disabled="submitting" />
      </DialogHeader>

      <DialogBody class="space-y-4">
        <p class="text-sm text-grey-600">
          How easy was it to complete your checkout?
        </p>

        <div class="flex items-start justify-between gap-1">
          <div
            v-for="option in RATINGS"
            :key="option.value"
            class="flex flex-1 flex-col items-center gap-1"
          >
            <button
              type="button"
              :disabled="submitting"
              :aria-label="`${option.value} — ${option.label}`"
              :class="[
                'flex size-12 items-center justify-center rounded-full text-2xl transition',
                rating === option.value
                  ? 'bg-primary-500 ring-2 ring-primary-500 ring-offset-2'
                  : 'bg-primary-50/70 hover:bg-primary-100',
              ]"
              @click="rating = option.value"
            >
              {{ option.emoji }}
            </button>
            <span
              class="text-xs"
              :class="rating === option.value ? 'font-semibold text-primary-600' : 'text-grey-400'"
            >
              {{ rating === option.value ? selectedLabel : option.value }}
            </span>
          </div>
        </div>

        <div v-if="rating > 0" class="space-y-1.5">
          <label for="review-comment" class="text-sm font-medium text-grey-900">
            Tell us more <span class="font-normal text-grey-400">(optional)</span>
          </label>
          <textarea
            id="review-comment"
            v-model="comment"
            :disabled="submitting"
            rows="3"
            maxlength="2000"
            placeholder="What made your experience great or how can we improve?"
            class="w-full resize-none rounded-xl border border-grey-50 bg-background-on-canvas px-3 py-2.5 text-sm text-grey-900 outline-none focus:border-primary-400 disabled:opacity-60"
          />
        </div>
      </DialogBody>

      <DialogFooter class="grid grid-cols-2 gap-3">
        <Button
          variant="neutral"
          size="medium"
          class="w-full"
          :disabled="submitting"
          @click="skip"
        >
          Skip
        </Button>
        <Button
          variant="primary"
          size="medium"
          class="w-full"
          :disabled="!rating || submitting"
          :loading="submitting"
          @click="submit"
        >
          Submit
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
