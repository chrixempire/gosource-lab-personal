<script setup lang="ts">
import { Checkbox, SearchField } from '@gosource/ui';
import { ChevronDown } from 'lucide-vue-next';
import SettingsPermissionsSkeleton from '~/components/settings/skeletons/SettingsPermissionsSkeleton.vue';
import type { PermissionSection } from '~/types/settings';

const props = defineProps<{
  sections: PermissionSection[];
  loading?: boolean;
}>();

const selected = defineModel<string[]>({ default: () => [] });

const searchQuery = ref('');
const expanded = ref<string[]>([]);

const filteredSections = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.sections;

  return props.sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.value.toLowerCase().includes(query) ||
          section.title.toLowerCase().includes(query),
      ),
    }))
    .filter((section) => section.items.length > 0);
});

const selectedList = computed(() => selected.value ?? []);

const selectedSet = computed(() => new Set(selectedList.value));

const allPermissionValues = computed(() =>
  props.sections.flatMap((section) => section.items.map((item) => item.value)),
);

const allChecked = computed<boolean | 'indeterminate'>(() => {
  const total = allPermissionValues.value.length;
  if (!total) return false;
  const count = selectedList.value.length;
  if (count === 0) return false;
  if (count === total) return true;
  return 'indeterminate';
});

function isSectionChecked(section: PermissionSection) {
  if (!section.items.length) return false;
  return section.items.every((item) => selectedSet.value.has(item.value));
}

function isSectionIndeterminate(section: PermissionSection) {
  const count = section.items.filter((item) => selectedSet.value.has(item.value)).length;
  return count > 0 && count < section.items.length;
}

function setSelected(values: string[]) {
  selected.value = values;
}

function toggleAll(checked: boolean | 'indeterminate') {
  if (checked === false) {
    setSelected([]);
    return;
  }
  setSelected([...allPermissionValues.value]);
}

function toggleSection(section: PermissionSection, checked: boolean | 'indeterminate') {
  const next = new Set(selectedList.value);
  section.items.forEach((item) => {
    if (checked === true) next.add(item.value);
    else next.delete(item.value);
  });
  setSelected([...next]);
}

function togglePermission(value: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedList.value);
  if (checked === true) next.add(value);
  else next.delete(value);
  setSelected([...next]);
}

function toggleExpanded(title: string) {
  if (expanded.value.includes(title)) {
    expanded.value = expanded.value.filter((entry) => entry !== title);
  } else {
    expanded.value = [...expanded.value, title];
  }
}

function expandAllSections() {
  expanded.value = filteredSections.value.map((section) => section.title);
}

function collapseAllSections() {
  expanded.value = [];
}

const expandedSet = computed(() => new Set(expanded.value));

function isSectionExpanded(title: string) {
  return expandedSet.value.has(title);
}

const allSectionsExpanded = computed(() => {
  const titles = filteredSections.value.map((section) => section.title);
  return titles.length > 0 && titles.every((title) => expandedSet.value.has(title));
});

watch(
  () => props.sections,
  (sections) => {
    if (!expanded.value.length && sections.length) {
      expanded.value = sections.map((section) => section.title);
    }
  },
  { immediate: true },
);
</script>

<template>
  <SettingsPermissionsSkeleton v-if="loading" />

  <section
    v-else
    class="rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-base font-semibold text-grey-900">Permissions</h2>
      <button
        type="button"
        class="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
        @click="allSectionsExpanded ? collapseAllSections() : expandAllSections()"
      >
        {{ allSectionsExpanded ? 'Collapse all' : 'Expand all' }}
      </button>
    </div>

    <SearchField
      v-model="searchQuery"
      class="mt-4"
      placeholder="Search permissions"
    />

    <div class="mt-4 flex items-center justify-between border-b border-grey-50 pb-3">
      <label class="flex cursor-pointer items-center gap-2 text-sm text-grey-700">
        <Checkbox
          :model-value="allChecked"
          @update:model-value="toggleAll"
        />
        Select all permissions
      </label>
      <p class="text-xs text-grey-500">{{ selectedList.length }} selected</p>
    </div>

    <div class="mt-2 space-y-2">
      <div
        v-for="section in filteredSections"
        :key="section.title"
        class="border-b border-grey-50 py-2 last:border-none"
      >
        <div class="flex items-start gap-2">
          <Checkbox
            class="mt-1"
            :model-value="isSectionChecked(section) ? true : isSectionIndeterminate(section) ? 'indeterminate' : false"
            :name="`section-${section.title}`"
            @update:model-value="(value) => toggleSection(section, value)"
          />
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
            :aria-expanded="isSectionExpanded(section.title)"
            @click="toggleExpanded(section.title)"
          >
            <span class="text-sm font-semibold capitalize text-grey-900">{{ section.title }}</span>
            <span class="flex items-center gap-1.5 text-xs text-grey-400">
              <span class="hidden sm:inline">
                {{ isSectionExpanded(section.title) ? 'Hide' : 'Show' }}
              </span>
              <ChevronDown
                class="size-4 shrink-0 transition-transform duration-300 ease-in-out"
                :class="isSectionExpanded(section.title) ? 'rotate-180' : 'rotate-0'"
              />
            </span>
          </button>
        </div>

        <div
          class="grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out motion-reduce:transition-none"
          :class="
            isSectionExpanded(section.title)
              ? 'mt-3 grid-rows-[1fr] opacity-100'
              : 'mt-0 grid-rows-[0fr] opacity-0'
          "
        >
          <div class="min-h-0 overflow-hidden">
            <div class="space-y-3 pl-7">
              <label
                v-for="item in section.items"
                :key="item.value"
                class="flex cursor-pointer items-start gap-2 text-sm text-grey-800"
              >
                <Checkbox
                  class="mt-0.5"
                  :model-value="selectedSet.has(item.value)"
                  :name="item.value"
                  @update:model-value="(value) => togglePermission(item.value, value)"
                />
                {{ item.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
