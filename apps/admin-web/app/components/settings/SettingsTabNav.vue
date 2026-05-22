<script setup lang="ts">
import { SETTINGS_TABS } from '~/lib/settings-constants';

const TAB_GAP_PX = 8;
const TAB_PADDING_PX = 4;

const route = useRoute();
const router = useRouter();

const activePath = computed(() => route.path);

const activeTabIndex = computed(() =>
  Math.max(
    0,
    SETTINGS_TABS.findIndex((tab) => tab.value === activePath.value),
  ),
);

const tabHighlightStyle = computed(() => ({
  width: `calc((100% - ${(SETTINGS_TABS.length - 1) * TAB_GAP_PX + TAB_PADDING_PX * 2}px) / ${SETTINGS_TABS.length})`,
  transform: `translateX(calc(${activeTabIndex.value} * (100% + ${TAB_GAP_PX}px)))`,
}));

function goToTab(path: string) {
  if (route.path === path) return;
  void router.push(path);
}
</script>

<template>
  <div class="border-b border-grey-50 bg-white px-4 py-4 sm:px-6">
    <div class="overflow-x-auto">
      <div
        class="relative inline-grid min-w-[44rem] grid-cols-5 gap-2 rounded-2xl border border-grey-50 bg-white p-1"
      >
        <div
          class="absolute bottom-1 left-1 top-1 rounded-xl bg-primary-50 transition-transform duration-300"
          :style="tabHighlightStyle"
        />
        <button
          v-for="tab in SETTINGS_TABS"
          :key="tab.value"
          type="button"
          class="relative z-10 cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          :class="
            activePath === tab.value
              ? 'text-primary-700'
              : 'text-grey-600 hover:text-grey-900'
          "
          @click="goToTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
  </div>
</template>
