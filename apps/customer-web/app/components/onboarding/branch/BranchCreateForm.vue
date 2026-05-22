<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@gosource/ui';
import { Check, ChevronDown } from 'lucide-vue-next';
import AddressAutocompleteInput from '~/components/shared/AddressAutocompleteInput.vue';
import type { AddressSelection } from '~/lib/google-maps';
import { lagosLocalGovernments } from '~/lib/lagos-lgas';

const props = defineProps<{
  branchName: string;
  streetName: string;
  lga: string;
  loading?: boolean;
  showSubmitButton?: boolean;
  branchNameError?: string;
  streetNameError?: string;
  lgaError?: string;
}>();

const emit = defineEmits<{
  'update:branchName': [value: string];
  'update:streetName': [value: string];
  'update:lga': [value: string];
  submit: [];
}>();

const lgaSearch = ref('');

const filteredLocalGovernments = computed(() => {
  const query = lgaSearch.value.trim().toLowerCase();

  if (!query) {
    return lagosLocalGovernments;
  }

  return lagosLocalGovernments.filter((option) =>
    option.toLowerCase().includes(query),
  );
});

function selectLga(option: string) {
  emit('update:lga', option);
  lgaSearch.value = '';
}

function applyAddressSelection(address: AddressSelection) {
  emit('update:streetName', address.streetName || address.formattedAddress);

  const matchedLga =
    matchLga(address.lga) ||
    matchLga(address.selectedText) ||
    matchLga(address.formattedAddress) ||
    matchLga(address.streetName);
  if (matchedLga) {
    emit('update:lga', matchedLga);
  }
}

function matchLga(value: string | null) {
  if (!value) {
    return '';
  }

  const normalizedValue = normalizeAlias(normalizeAreaName(value));

  return (
    lagosLocalGovernments.find(
      (option) => normalizeAlias(normalizeAreaName(option)) === normalizedValue,
    ) ??
    lagosLocalGovernments.find((option) =>
      normalizedValue.includes(normalizeAlias(normalizeAreaName(option))),
    ) ??
    lagosLocalGovernments.find((option) =>
      normalizeAlias(normalizeAreaName(option)).includes(normalizedValue),
    ) ??
    ''
  );
}

function normalizeAreaName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\blocal government area\b/g, '')
    .replace(/\blocal govt area\b/g, '')
    .replace(/\blga\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const lgaAliases: Record<string, string> = {
  shomolu: 'somolu',
};

function normalizeAlias(value: string) {
  return value
    .split(' ')
    .map((part) => lgaAliases[part] ?? part)
    .join(' ');
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Branch name</span>
      <Input
        :model-value="props.branchName"
        placeholder="Ikeja branch"
        autocomplete="organization"
        :disabled="props.loading"
        :invalid="Boolean(props.branchNameError)"
        @update:model-value="emit('update:branchName', $event)"
      />
      <p v-if="props.branchNameError" class="text-[12px] font-medium text-negative-500">
        {{ props.branchNameError }}
      </p>
    </label>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Street name</span>
      <AddressAutocompleteInput
        :model-value="props.streetName"
        placeholder="Search or enter your business street address"
        :disabled="props.loading"
        :invalid="Boolean(props.streetNameError)"
        @update:model-value="emit('update:streetName', $event)"
        @select="applyAddressSelection"
      />
      <p v-if="props.streetNameError" class="text-[12px] font-medium text-negative-500">
        {{ props.streetNameError }}
      </p>
    </label>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">State</span>
      <Input model-value="Lagos" disabled />
    </label>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">LGA</span>
      <DropdownMenu>
        <DropdownMenuTrigger as-child :disabled="props.loading">
          <button
            type="button"
            :class="[
              'flex h-10 w-full items-center justify-between rounded-[10px] bg-grey-55 px-4 py-2.5 text-left text-[14px] shadow-none outline-none transition disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
              props.lga
                ? 'text-grey-900'
                : 'text-grey-400',
              props.lgaError
                ? 'border border-negative-500 focus:border-negative-500 focus:ring-4 focus:ring-negative-500/10'
                : 'border border-border-input-default focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12',
            ]"
          >
            <span>{{ props.lga || 'Select your local government area' }}</span>
            <ChevronDown class="size-4 shrink-0 text-grey-300" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent class="max-h-72 w-[var(--reka-dropdown-menu-trigger-width)] overflow-y-auto">
          <div class="px-2 pb-2 pt-1">
            <Input
              :model-value="lgaSearch"
              placeholder="Search LGA"
              class="h-9 bg-background-on-canvas"
              @update:model-value="lgaSearch = $event"
              @keydown.stop
            />
          </div>

          <DropdownMenuItem
            v-for="option in filteredLocalGovernments"
            :key="option"
            @select="selectLga(option)"
          >
            <div class="flex w-full items-center justify-between gap-3">
              <span>{{ option }}</span>
              <Check v-if="props.lga === option" class="size-4 text-primary-500" />
            </div>
          </DropdownMenuItem>

          <div
            v-if="filteredLocalGovernments.length === 0"
            class="px-3 py-2 text-[13px] text-grey-300"
          >
            No LGA found for "{{ lgaSearch }}"
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <p v-if="props.lgaError" class="text-[12px] font-medium text-negative-500">
        {{ props.lgaError }}
      </p>
    </label>

    <Button v-if="props.showSubmitButton !== false" size="medium" class="w-full" type="submit" :loading="props.loading">
      Create branch
    </Button>
  </form>
</template>
