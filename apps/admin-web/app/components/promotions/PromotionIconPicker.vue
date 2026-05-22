<script setup lang="ts">
import { Popover, PopoverContent, PopoverTrigger, SearchField, cn } from '@gosource/ui';
import * as lucideIcons from 'lucide-vue-next';
import { Plus } from 'lucide-vue-next';
import { computed, h, render } from 'vue';
import {
  DEFAULT_PROMOTION_ICON_COLOR,
  PROMOTION_ICON_COLORS,
  type PromotionIconColor,
} from '~/lib/promotion-icon-colors';

const iconModel = defineModel<string>({ required: true });
const colorModel = defineModel<string>('color', { default: DEFAULT_PROMOTION_ICON_COLOR });
const fieldError = defineModel<string>('fieldError', { default: '' });

const isOpen = ref(false);
const search = ref('');
const selectedIconName = ref<string | null>(null);

const iconsRecord = lucideIcons as Record<string, unknown>;

const iconList = Object.keys(lucideIcons).filter((key) => {
  const entry = iconsRecord[key];
  return (
    key !== 'createLucideIcon' &&
    key !== 'default' &&
    !key.endsWith('Icon') &&
    (typeof entry === 'object' || typeof entry === 'function')
  );
});

const filteredIcons = computed(() => {
  const q = search.value.trim().toLowerCase();
  const result = iconList.filter((name) => name.toLowerCase().includes(q));
  return result.slice(0, 100);
});

const selectedColor = computed(() => {
  return (
    PROMOTION_ICON_COLORS.find((entry) => entry.value === colorModel.value) ??
    PROMOTION_ICON_COLORS[0]!
  );
});

const isSvg = computed(() => iconModel.value?.trim().startsWith('<svg'));

const previewComponent = computed(() => {
  if (!iconModel.value || isSvg.value) {
    return null;
  }
  const comp = iconsRecord[iconModel.value];
  if (typeof comp === 'object' || typeof comp === 'function') {
    return comp;
  }
  return null;
});

function getSvgFromIcon(iconComp: unknown) {
  if (typeof document === 'undefined') {
    return '';
  }
  const div = document.createElement('div');
  render(h(iconComp as Parameters<typeof h>[0]), div);
  return div.innerHTML;
}

function selectIcon(name: string) {
  const iconComp = iconsRecord[name];
  if (iconComp) {
    iconModel.value = getSvgFromIcon(iconComp);
    selectedIconName.value = name;
    fieldError.value = '';
  }
  isOpen.value = false;
}

function selectColor(color: PromotionIconColor) {
  colorModel.value = color.value;
}
</script>

<template>
  <div class="space-y-2">
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="group flex w-fit cursor-pointer items-end gap-4 text-left"
        >
          <div
            class="flex size-16 items-center justify-center rounded-xl border transition-colors"
            :style="{
              backgroundColor: selectedColor.bg,
              borderColor: selectedColor.border,
            }"
          >
            <div
              v-if="isSvg && iconModel"
              class="size-8 [&>svg]:h-full [&>svg]:w-full"
              :style="{ color: selectedColor.value }"
              v-html="iconModel"
            />
            <component
              :is="previewComponent"
              v-else-if="previewComponent"
              class="size-8"
              :style="{ color: selectedColor.value }"
            />
            <Plus v-else class="size-5 text-grey-400" />
          </div>
          <div>
            <p class="text-sm font-medium text-grey-900">Select icon</p>
            <p class="text-xs text-grey-500">Select icons to represent the promotion</p>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent class="w-[min(92vw,380px)] p-4" align="start">
        <div class="space-y-4">
          <SearchField v-model="search" placeholder="Search icons" />

          <div class="flex flex-wrap gap-2">
            <button
              v-for="colorOption in PROMOTION_ICON_COLORS"
              :key="colorOption.name"
              type="button"
              class="size-8 rounded-lg border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              :class="
                cn(colorModel === colorOption.value && 'ring-2 ring-primary-500 ring-offset-2')
              "
              :style="{
                backgroundColor: colorOption.bg,
                borderColor: colorOption.border,
              }"
              :aria-label="`Color ${colorOption.name}`"
              @click="selectColor(colorOption)"
            />
          </div>

          <div class="max-h-[300px] overflow-y-auto pr-1">
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="iconName in filteredIcons"
                :key="iconName"
                type="button"
                class="flex aspect-square items-center justify-center rounded-lg p-2 transition-colors hover:bg-grey-55 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                :class="
                  selectedIconName === iconName
                    ? 'bg-primary-50 ring-2 ring-primary-500/40'
                    : ''
                "
                @click="selectIcon(iconName)"
              >
                <component :is="iconsRecord[iconName]" class="size-6 text-grey-700" />
              </button>
            </div>
            <p
              v-if="filteredIcons.length === 0"
              class="py-10 text-center text-sm text-grey-500"
            >
              No icons found
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>

    <p v-if="fieldError" class="text-xs text-negative-500">{{ fieldError }}</p>
  </div>
</template>
