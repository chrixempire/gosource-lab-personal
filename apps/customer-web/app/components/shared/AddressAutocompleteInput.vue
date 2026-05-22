<script setup lang="ts">
import { AlertCircle, LoaderCircle, LocateFixed, MapPinned } from 'lucide-vue-next';
import { useDebounceFn } from '@vueuse/core';
import {
  AutocompleteAnchor,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompletePortal,
  AutocompleteRoot,
  AutocompleteViewport,
} from 'reka-ui';
import {
  getAddressSelection,
  getAddressSuggestions,
  reverseGeocodeAddressSelection,
  type AddressSelection,
  type AddressSuggestion,
} from '~/lib/google-maps';

const props = withDefaults(defineProps<{
  modelValue: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  autocomplete?: string;
}>(), {
  disabled: false,
  invalid: false,
  placeholder: 'Search for a business address',
  autocomplete: 'street-address',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  select: [value: AddressSelection];
}>();

const config = useRuntimeConfig();
const googleMapsApiKey = config.public.googleMapsApiKey?.trim() ?? '';

const searchValue = ref(props.modelValue);
const suggestions = ref<AddressSuggestion[]>([]);
const dropdownOpen = ref(false);
const searching = ref(false);
const loadingDetails = ref(false);
const locatingCurrentPosition = ref(false);
const loadError = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const suppressNextLookup = ref(false);
const currentLocationDescription = ref('Use your device location to fill this address');

const canUseCurrentLocation = computed(() =>
  import.meta.client &&
  !!googleMapsApiKey &&
  typeof navigator !== 'undefined' &&
  'geolocation' in navigator,
);

watch(
  () => props.modelValue,
  (value) => {
    if (value !== searchValue.value) {
      searchValue.value = value;
    }
  },
);

const fetchSuggestions = useDebounceFn(async (value: string) => {
  if (!googleMapsApiKey || !value.trim()) {
    suggestions.value = [];
    searching.value = false;
    return;
  }

  searching.value = true;
  loadError.value = '';

  try {
    suggestions.value = await getAddressSuggestions(googleMapsApiKey, value);
    dropdownOpen.value =
      (suggestions.value.length > 0 || canUseCurrentLocation.value) &&
      document.activeElement === inputRef.value;
  } catch {
    suggestions.value = [];
    loadError.value = 'Address suggestions are unavailable right now.';
  } finally {
    searching.value = false;
  }
}, 250);

watch(searchValue, (value) => {
  emit('update:modelValue', value);

  if (suppressNextLookup.value) {
    suppressNextLookup.value = false;
    return;
  }

  if (!value.trim()) {
    suggestions.value = [];
    dropdownOpen.value = canUseCurrentLocation.value && document.activeElement === inputRef.value;
    loadError.value = '';
    return;
  }

  void fetchSuggestions(value);
});

async function selectSuggestion(suggestion: AddressSuggestion) {
  suppressNextLookup.value = true;
  searchValue.value = suggestion.description;
  suggestions.value = [];
  dropdownOpen.value = false;

  if (!googleMapsApiKey) {
    return;
  }

  loadingDetails.value = true;
  loadError.value = '';

  try {
    const address = await getAddressSelection(googleMapsApiKey, suggestion.placeId);
    if (address) {
      suppressNextLookup.value = true;
      searchValue.value = address.streetName || suggestion.description;
      emit('update:modelValue', searchValue.value);
      emit('select', {
        ...address,
        selectedText: suggestion.description,
      });
    }
  } catch {
    loadError.value = 'We could not load the selected address details.';
  } finally {
    loadingDetails.value = false;
  }
}

function openDropdown() {
  if (suggestions.value.length > 0 || canUseCurrentLocation.value) {
    dropdownOpen.value = true;
  }
}

function closeDropdown() {
  window.setTimeout(() => {
    dropdownOpen.value = false;
  }, 120);
}

async function useCurrentLocation() {
  if (!canUseCurrentLocation.value || locatingCurrentPosition.value) {
    return;
  }

  locatingCurrentPosition.value = true;
  loadError.value = '';

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });

    const address = await reverseGeocodeAddressSelection(
      googleMapsApiKey,
      position.coords.latitude,
      position.coords.longitude,
    );

    if (!address) {
      loadError.value = 'We could not determine an address from your current location.';
      return;
    }

    currentLocationDescription.value = address.formattedAddress || currentLocationDescription.value;
    suggestions.value = [];
    dropdownOpen.value = false;
    suppressNextLookup.value = true;
    searchValue.value = address.streetName || address.formattedAddress;
    emit('update:modelValue', searchValue.value);
    emit('select', {
      ...address,
      selectedText: address.formattedAddress || address.streetName,
    });
  } catch (error) {
    const locationError = error as GeolocationPositionError | Error | undefined;
    loadError.value =
      'code' in (locationError ?? {})
        ? 'Location access was unavailable. You can still type your address manually.'
        : 'We could not use your current location right now.';
  } finally {
    locatingCurrentPosition.value = false;
  }
}
</script>

<template>
  <div class="space-y-2">
    <AutocompleteRoot
      v-model="searchValue"
      :open="dropdownOpen"
      :disabled="disabled"
      :ignore-filter="true"
      @update:open="dropdownOpen = $event"
    >
      <AutocompleteAnchor class="relative w-full">
        <AutocompleteInput as-child>
          <input
            ref="inputRef"
            :disabled="disabled"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            :placeholder="props.placeholder"
            :class="[
              'flex h-10 w-full rounded-[10px] bg-grey-55 px-4 py-2.5 pr-11 text-[14px] text-grey-900 shadow-none outline-none transition placeholder:text-grey-400 disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
              props.invalid
                ? 'border border-negative-500 focus:border-negative-500'
                : 'border border-border-input-default focus:border-border-input-active',
            ]"
            @focus="openDropdown"
            @blur="closeDropdown"
          >
        </AutocompleteInput>

        <LoaderCircle
          v-if="searching || loadingDetails || locatingCurrentPosition"
          class="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-grey-300"
        />
        <MapPinned
          v-else
          class="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-grey-300"
        />
      </AutocompleteAnchor>

      <AutocompletePortal>
        <AutocompleteContent
          position="popper"
          side="bottom"
          align="start"
          :side-offset="4"
          hide-when-empty
          class="z-[120] w-[var(--reka-combobox-trigger-width)] overflow-hidden rounded-[14px] border border-border-default bg-white shadow-[0_16px_40px_rgba(16,24,40,0.14)]"
        >
          <AutocompleteViewport class="max-h-72 overflow-y-auto py-1">
            <button
              v-if="canUseCurrentLocation"
              type="button"
              class="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition hover:bg-grey-55"
              @mousedown.stop.prevent="void useCurrentLocation()"
              @click.stop.prevent
            >
              <LocateFixed class="mt-0.5 size-4 shrink-0 text-primary-500" />
              <span class="min-w-0">
                <span class="block truncate text-[13px] font-semibold text-grey-900">
                  Use current location
                </span>
                <span class="block truncate text-[12px] text-grey-text">
                  {{ currentLocationDescription }}
                </span>
              </span>
            </button>

            <div
              v-if="canUseCurrentLocation && suggestions.length > 0"
              class="mx-4 my-1 h-px bg-grey-75"
            />

            <AutocompleteEmpty class="px-4 py-3 text-[12px] text-grey-300">
              No address suggestions found.
            </AutocompleteEmpty>

            <AutocompleteItem
              v-for="suggestion in suggestions"
              :key="suggestion.placeId"
              as-child
              :value="suggestion.description"
            >
              <button
                type="button"
                class="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition hover:bg-grey-55 data-[highlighted]:bg-grey-55"
                @mousedown.stop.prevent="void selectSuggestion(suggestion)"
                @click.stop.prevent
              >
                <MapPinned class="mt-0.5 size-4 shrink-0 text-primary-500" />
                <span class="min-w-0">
                  <span class="block truncate text-[13px] font-semibold text-grey-900">
                    {{ suggestion.mainText }}
                  </span>
                  <span class="block truncate text-[12px] text-grey-text">
                    {{ suggestion.secondaryText || suggestion.description }}
                  </span>
                </span>
              </button>
            </AutocompleteItem>
          </AutocompleteViewport>
        </AutocompleteContent>
      </AutocompletePortal>
    </AutocompleteRoot>

    <p v-if="loadError" class="flex items-start gap-2 text-[12px] font-medium text-warning-700">
      <AlertCircle class="mt-0.5 size-3.5 shrink-0" />
      <span>{{ loadError }}</span>
    </p>

    <p v-else-if="!googleMapsApiKey" class="text-[12px] text-grey-300">
      Add `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` to enable address suggestions. Manual entry still works.
    </p>
  </div>
</template>
