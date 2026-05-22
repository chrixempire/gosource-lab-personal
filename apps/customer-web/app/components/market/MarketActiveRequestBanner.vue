<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ClipboardList, X } from 'lucide-vue-next';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';

const {
  isAddingToRequest,
  isRequestReady,
  bootstrapLoading,
  requestReference,
  finishAddingToRequest,
  cancelAddingToRequest,
} = useRequestAddItemsMode();
</script>

<template>
  <div
    v-if="isAddingToRequest"
    class="mb-4 mt-3 rounded-[18px] border border-primary-200 bg-primary-50/80 px-3.5 py-3.5 sm:mt-4 sm:px-4 sm:py-4"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <div
          class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm"
        >
          <ClipboardList class="size-5" />
        </div>

        <div class="min-w-0">
              <p class="text-sm font-semibold text-grey-900">
                <template v-if="isRequestReady">
                  Adding to request {{ requestReference }}
                </template>
                <template v-else>
                  Loading request…
                </template>
              </p>
              <p class="mt-1 text-[13px] leading-6 text-grey-text">
                <template v-if="isRequestReady">
                  Items are added via your cart, then saved to this request. Open the request panel
                  to review lines, or tap Done when finished.
                </template>
                <template v-else-if="bootstrapLoading">
                  Preparing the market for this request…
                </template>
              </p>

          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="small"
              type="button"
              class="w-full sm:w-auto"
              :disabled="!isRequestReady || bootstrapLoading"
              @click="finishAddingToRequest"
            >
              Done adding items
            </Button>
            <Button
              variant="ghost"
              size="small"
              type="button"
              class="w-full sm:w-auto"
              @click="cancelAddingToRequest"
            >
              Back to request
            </Button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center rounded-full text-grey-300 transition hover:bg-white/70 hover:text-grey-900"
        aria-label="Back to request"
        @click="cancelAddingToRequest"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
</template>
