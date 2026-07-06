<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import AdminInvoicePreviewShell from '~/components/shared/AdminInvoicePreviewShell.vue';
import type { AdminActivityLogItem } from '~/types/activity-log';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  log: AdminActivityLogItem | null;
}>();

const MODULE_LABELS: Record<string, string> = {
  product: 'Items',
  category: 'Categories',
  purchaseorder: 'Purchase order',
};

function moduleLabel(module: string) {
  return MODULE_LABELS[module.trim().toLowerCase()] ?? module;
}

function actionVariant(action: string) {
  const normalized = action.toUpperCase();
  if (normalized === 'CREATE') return 'success';
  if (normalized === 'UPDATE') return 'warning';
  if (normalized === 'DELETE') return 'negative';
  return 'default';
}

function initiatorTypeLabel(type: string) {
  const normalized = type.trim().toUpperCase();
  if (normalized === 'ADMIN') return 'Admin';
  if (normalized === 'BUSINESS') return 'Business';
  return type;
}

const CURRENCY_HINT = /(price|cost|amount|total|fee)/i;

function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Parse values that arrive as JSON strings (e.g. unit maps) into real objects. */
function maybeParse(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return value;
      }
    }
  }
  return value;
}

function formatNaira(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return `₦${num.toLocaleString('en-NG')}`;
}

function isNumericLike(value: unknown) {
  return (
    typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value)))
  );
}

function formatScalar(key: string, value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (CURRENCY_HINT.test(key) && isNumericLike(value)) return formatNaira(value);
  return String(value);
}

function renderValue(key: string, value: unknown): string {
  const parsed = maybeParse(value);
  if (parsed && typeof parsed === 'object') {
    return JSON.stringify(parsed, null, 2);
  }
  return formatScalar(key, parsed);
}

/** True when a value is an image URL we should render as a thumbnail. */
function isImageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^https?:\/\/\S+\.(jpe?g|png|webp|gif|svg)(\?\S*)?$/i.test(value.trim());
}

type ChangeRow = { label: string; old: string; new: string };
type KvRow = { label: string; value: string };
type Group = { title: string; rows: KvRow[] };

function toChangeRows(source: unknown): ChangeRow[] {
  if (!source || typeof source !== 'object') return [];
  return Object.entries(source as Record<string, any>)
    .filter(([, change]) => change && typeof change === 'object')
    .map(([field, change]) => ({
      label: humanizeKey(field),
      old: formatScalar(field, change?.old),
      new: formatScalar(field, change?.new),
    }));
}

// Old → new rows from both product price changes and generic field changes
// (e.g. a category's title/description edit).
const priceChangeRows = computed<ChangeRow[]>(() => [
  ...toChangeRows(props.log?.metadata?.priceChanges),
  ...toChangeRows(props.log?.metadata?.changes),
]);

const scalarRows = computed<KvRow[]>(() => {
  const metadata = props.log?.metadata;
  if (!metadata) return [];
  const rows: KvRow[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (key === 'priceChange' || key === 'priceChanges' || key === 'changes')
      continue;
    const parsed = maybeParse(value);
    if (parsed && typeof parsed === 'object') continue;
    if (value == null || value === '') continue;
    rows.push({ label: humanizeKey(key), value: formatScalar(key, value) });
  }
  return rows;
});

const detailGroups = computed<Group[]>(() => {
  const metadata = props.log?.metadata;
  if (!metadata) return [];
  const groups: Group[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (key === 'priceChange' || key === 'priceChanges' || key === 'changes')
      continue;
    const parsed = maybeParse(value);
    if (!parsed || typeof parsed !== 'object') continue;

    if (Array.isArray(parsed)) {
      const rows: KvRow[] = parsed.map((item, index) => {
        if (item && typeof item === 'object') {
          const entries = Object.entries(item as Record<string, unknown>).filter(
            ([, v]) => v != null && v !== '',
          );
          // Use a name/title field as the row label, summarise the rest.
          const nameEntry = entries.find(([k]) => /name|title/i.test(k));
          const label = nameEntry
            ? String(nameEntry[1])
            : `Item ${index + 1}`;
          const value = entries
            .filter(([k]) => k !== nameEntry?.[0])
            .map(([k, v]) => `${humanizeKey(k)}: ${renderValue(k, v)}`)
            .join(' · ');
          return { label, value };
        }
        return { label: `Item ${index + 1}`, value: String(item) };
      });
      groups.push({ title: humanizeKey(key), rows });
      continue;
    }

    const rows = Object.entries(parsed as Record<string, unknown>)
      .filter(([innerKey]) => innerKey !== 'version')
      .filter(([, innerValue]) => innerValue != null && innerValue !== '')
      .map(([innerKey, innerValue]) => ({
        label: humanizeKey(innerKey),
        value: renderValue(innerKey, innerValue),
      }));

    if (rows.length) {
      groups.push({ title: humanizeKey(key), rows });
    }
  }
  return groups;
});

const hasDetails = computed(
  () =>
    priceChangeRows.value.length > 0 ||
    scalarRows.value.length > 0 ||
    detailGroups.value.length > 0,
);
</script>

<template>
  <AdminInvoicePreviewShell v-model:open="open" title="Activity details">
    <div v-if="!log" class="p-5 text-sm text-grey-500">
      No activity selected.
    </div>

    <div v-else class="space-y-5 p-4 sm:p-5">
      <section class="rounded-xl border border-grey-50 p-4">
        <p class="text-sm font-semibold text-grey-900">{{ log.description }}</p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <StatusTag variant="default" size="medium">
            {{ moduleLabel(log.module) }}
          </StatusTag>
          <StatusTag :variant="actionVariant(log.action)" size="medium">
            {{ log.action }}
          </StatusTag>
        </div>
      </section>

      <section class="rounded-xl border border-grey-50 p-4">
        <h3 class="text-xs font-medium uppercase tracking-wide text-grey-500">
          Who &amp; when
        </h3>
        <dl class="mt-3 space-y-3">
          <div>
            <dt class="text-xs text-grey-500">Performed by</dt>
            <dd class="mt-0.5 text-sm font-semibold text-grey-900">
              {{ log.initiatorName || 'Unknown' }}
            </dd>
            <dd class="text-xs text-grey-500">
              {{ initiatorTypeLabel(log.initiatorType) }}
            </dd>
            <dd v-if="log.initiatorRole" class="text-xs text-grey-400">
              {{ log.initiatorRole }}
            </dd>
            <dd v-if="log.initiatorEmail" class="text-xs text-grey-400">
              {{ log.initiatorEmail }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-grey-500">Date &amp; time</dt>
            <dd class="mt-0.5 text-sm text-grey-900">{{ log.createdAtLabel }}</dd>
          </div>
          <div v-if="log.ipAddress">
            <dt class="text-xs text-grey-500">IP address</dt>
            <dd class="mt-0.5 font-mono text-sm text-grey-900">{{ log.ipAddress }}</dd>
          </div>
        </dl>
      </section>

      <section
        v-if="priceChangeRows.length"
        class="rounded-xl border border-grey-50 p-4"
      >
        <h3 class="text-xs font-medium uppercase tracking-wide text-grey-500">
          Changes
        </h3>
        <ul class="mt-3 space-y-2">
          <li
            v-for="row in priceChangeRows"
            :key="row.label"
            class="flex flex-wrap items-center gap-2 text-sm"
          >
            <span class="text-grey-600">{{ row.label }}</span>
            <template v-if="isImageUrl(row.old) || isImageUrl(row.new)">
              <img
                v-if="isImageUrl(row.old)"
                :src="row.old"
                alt="previous image"
                class="size-12 rounded-md object-cover opacity-60 ring-1 ring-grey-100"
              >
              <span v-else class="text-grey-400 line-through">{{ row.old }}</span>
              <span aria-hidden="true" class="text-grey-400">→</span>
              <img
                v-if="isImageUrl(row.new)"
                :src="row.new"
                alt="new image"
                class="size-12 rounded-md object-cover ring-1 ring-grey-100"
              >
              <span v-else class="font-semibold text-grey-900">{{ row.new }}</span>
            </template>
            <template v-else>
              <span class="text-grey-400 line-through">{{ row.old }}</span>
              <span aria-hidden="true" class="text-grey-400">→</span>
              <span class="font-semibold text-grey-900">{{ row.new }}</span>
            </template>
          </li>
        </ul>
      </section>

      <section
        v-if="scalarRows.length"
        class="rounded-xl border border-grey-50 p-4"
      >
        <h3 class="text-xs font-medium uppercase tracking-wide text-grey-500">
          Details
        </h3>
        <dl class="mt-3 space-y-3">
          <div v-for="row in scalarRows" :key="row.label">
            <dt class="text-xs text-grey-500">{{ row.label }}</dt>
            <dd class="mt-0.5 break-words text-sm text-grey-900">
              <img
                v-if="isImageUrl(row.value)"
                :src="row.value"
                alt="image"
                class="size-16 rounded-md object-cover ring-1 ring-grey-100"
              >
              <template v-else>{{ row.value }}</template>
            </dd>
          </div>
        </dl>
      </section>

      <section
        v-for="group in detailGroups"
        :key="group.title"
        class="rounded-xl border border-grey-50 p-4"
      >
        <h3 class="text-xs font-medium uppercase tracking-wide text-grey-500">
          {{ group.title }}
        </h3>
        <dl class="mt-3 space-y-3">
          <div v-for="(row, index) in group.rows" :key="`${group.title}-${index}`">
            <dt v-if="row.label" class="text-xs text-grey-500">{{ row.label }}</dt>
            <dd
              class="mt-0.5 whitespace-pre-wrap break-words text-sm text-grey-900"
            >
              <img
                v-if="isImageUrl(row.value)"
                :src="row.value"
                alt="image"
                class="size-16 rounded-md object-cover ring-1 ring-grey-100"
              >
              <template v-else>{{ row.value }}</template>
            </dd>
          </div>
        </dl>
      </section>

      <p v-if="!hasDetails" class="px-1 text-sm text-grey-400">
        No additional details recorded for this activity.
      </p>

      <NuxtLink
        v-if="log.objectLink"
        :to="log.objectLink"
        class="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline"
        @click="open = false"
      >
        View {{ moduleLabel(log.module) }} record →
      </NuxtLink>
    </div>
  </AdminInvoicePreviewShell>
</template>
