<script setup lang="ts">
import { Button, toast } from '@gosource/ui';
import { ImagePlus, Upload } from 'lucide-vue-next';
import MarketplaceBannerPreviewCarousel from '~/components/promotions/MarketplaceBannerPreviewCarousel.vue';
import MarketplaceBannerUploadGrid from '~/components/promotions/MarketplaceBannerUploadGrid.vue';
import {
  buildMarketplaceBannerPublishPayload,
  createEmptyBannerSlots,
  MARKETPLACE_BANNER_SAMPLE_URLS,
  MARKETPLACE_BANNER_SLOT_COUNT,
  readMarketplaceBannerDraftFromStorage,
  writeMarketplaceBannerDraftToStorage,
  type MarketplaceBannerDraftSlot,
} from '~/lib/marketplace-banners';

const slots = ref<MarketplaceBannerDraftSlot[]>(createEmptyBannerSlots());
const uploading = ref(false);

function hydrateDraft() {
  const stored = readMarketplaceBannerDraftFromStorage();
  if (stored.length > 0) {
    slots.value = stored;
    return;
  }

  slots.value = MARKETPLACE_BANNER_SAMPLE_URLS.map((src, index) => ({
    id: `banner-${index + 1}`,
    src,
    file: null,
    alt: `Marketplace banner ${index + 1}`,
  }));
}

function onAdd(files: File[]) {
  for (const file of files) {
    if (slots.value.length >= MARKETPLACE_BANNER_SLOT_COUNT) {
      break;
    }

    slots.value.push({
      id: `banner-${Date.now()}-${slots.value.length + 1}`,
      src: URL.createObjectURL(file),
      file,
      alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
    });
  }
}

function onReplace(index: number, file: File) {
  const existing = slots.value[index];
  if (!existing) {
    return;
  }

  if (existing.src.startsWith('blob:')) {
    URL.revokeObjectURL(existing.src);
  }

  slots.value[index] = {
    ...existing,
    src: URL.createObjectURL(file),
    file,
    alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
  };
}

function onRemove(index: number) {
  const existing = slots.value[index];
  if (existing?.src.startsWith('blob:')) {
    URL.revokeObjectURL(existing.src);
  }

  slots.value.splice(index, 1);
}

function loadSampleBanners() {
  slots.value.forEach((slot) => {
    if (slot.src.startsWith('blob:')) {
      URL.revokeObjectURL(slot.src);
    }
  });

  slots.value = MARKETPLACE_BANNER_SAMPLE_URLS.map((src, index) => ({
    id: `banner-${index + 1}`,
    src,
    file: null,
    alt: `Marketplace banner ${index + 1}`,
  }));

  toast.success('Sample banners loaded');
}

async function publishBanners() {
  if (slots.value.length === 0) {
    toast.error('Add at least one banner image before uploading.');
    return;
  }

  uploading.value = true;

  try {
    const payload = await buildMarketplaceBannerPublishPayload(slots.value);
    writeMarketplaceBannerDraftToStorage(payload);

    toast.success('Banners saved for preview', {
      description:
        'UI-only for now — customer marketplace will use the API once backend storage is wired.',
      duration: 5000,
    });
  } catch {
    toast.error('Unable to prepare banners for upload.');
  } finally {
    uploading.value = false;
  }
}

onMounted(hydrateDraft);

onBeforeUnmount(() => {
  slots.value.forEach((slot) => {
    if (slot.src.startsWith('blob:')) {
      URL.revokeObjectURL(slot.src);
    }
  });
});
</script>

<template>
  <section class="rounded-2xl border border-grey-50 bg-white p-4 sm:p-5">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-grey-900">Banners</h2>
        <p class="mt-1 max-w-2xl text-sm text-grey-500">
          Upload up to four square images for the customer marketplace hero carousel.
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="ImagePlus"
        @click="loadSampleBanners"
      >
        Load samples
      </Button>
    </div>

    <div class="mt-4">
      <MarketplaceBannerUploadGrid
        :slots="slots"
        @add="onAdd"
        @replace="onReplace"
        @remove="onRemove"
      />
    </div>

    <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-xs text-grey-400">
        Recommended: square JPG or PNG, at least 900×900px.
      </p>
      <Button
        type="button"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="Upload"
        :loading="uploading"
        @click="publishBanners"
      >
        Upload
      </Button>
    </div>

    <div v-if="slots.length > 0" class="mt-5 border-t border-grey-50 pt-5">
      <p class="mb-3 text-sm font-medium text-grey-700">Marketplace preview</p>
      <MarketplaceBannerPreviewCarousel :slots="slots" />
    </div>
  </section>
</template>
