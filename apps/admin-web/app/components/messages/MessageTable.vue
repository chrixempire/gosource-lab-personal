<script setup lang="ts">
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PaginationBar,
  StatusTag,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from "@gosource/ui";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Ellipsis,
  LoaderCircle,
  Mail,
} from "lucide-vue-next";
import type {
  AdminMessageRow,
  AdminMessageStatus,
  AdminMessageType,
  AdminMessageListMeta,
} from "~/types/messages";

type SortKey = "message" | "type" | "status" | "createdAt";

const props = defineProps<{
  messages: AdminMessageRow[];
  meta: AdminMessageListMeta;
  loading?: boolean;
  busyMessageId?: string | null;
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  searchActive?: boolean;
}>();

const selectedIds = defineModel<string[]>("selectedIds", { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  sort: [key: SortKey];
  resend: [message: AdminMessageRow];
  edit: [message: AdminMessageRow];
  toggleStatus: [message: AdminMessageRow];
  delete: [id: string];
}>();

const gridTemplate =
  "2.75rem minmax(0,1.4fr) minmax(0,.65fr) minmax(0,.65fr) minmax(0,.9fr) 2.5rem";
const selectedSet = computed(() => new Set(selectedIds.value ?? []));
const selectionState = computed<boolean | "indeterminate">(() => {
  if (props.messages.length === 0) return false;
  const selected = props.messages.filter((row) =>
    selectedSet.value.has(row.id),
  ).length;
  if (selected === 0) return false;
  if (selected === props.messages.length) return true;
  return "indeterminate";
});

function toggleAll(value: boolean | "indeterminate") {
  const pageIds = new Set(props.messages.map((row) => row.id));
  const next = new Set(selectedIds.value);
  if (value === false) pageIds.forEach((id) => next.delete(id));
  else pageIds.forEach((id) => next.add(id));
  selectedIds.value = [...next];
}

function toggleRow(id: string, value: boolean | "indeterminate") {
  const next = new Set(selectedIds.value);
  if (value === true) next.add(id);
  else next.delete(id);
  selectedIds.value = [...next];
}

function statusVariant(status: AdminMessageStatus) {
  if (status === "active" || status === "sent") return "success" as const;
  if (status === "failed") return "negative" as const;
  if (status === "pending") return "warning" as const;
  return "default" as const;
}

function statusLabel(status: AdminMessageStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function typeLabel(type: AdminMessageType) {
  return type === "email" ? "Email" : "Alert";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
</script>

<template>
  <TableShell
    class="flex flex-col overflow-visible rounded-xl border border-grey-50 bg-white shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
  >
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
        <TableCell class="flex items-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all messages on this page"
            @update:model-value="toggleAll"
            @click.stop
          />
        </TableCell>
        <TableCell
          v-for="column in [
            ['message', 'Message'],
            ['type', 'Type'],
            ['status', 'Status'],
            ['createdAt', 'Date added'],
          ] as const"
          :key="column[0]"
        >
          <button
            type="button"
            class="inline-flex items-center gap-1 font-medium"
            @click="emit('sort', column[0])"
          >
            {{ column[1] }}
            <component
              :is="sortOrder === 'asc' ? ArrowUp : ArrowDown"
              v-if="sortKey === column[0]"
              class="size-3.5"
            />
          </button>
        </TableCell>
        <TableCell />
      </TableHeadRow>
    </TableHeader>

    <div v-if="loading" class="min-h-0 flex-1">
      <TableSkeleton
        :columns="Array(6).fill({ kind: 'line' as const, lineClass: 'w-full' })"
        :grid-template-columns="gridTemplate"
        :row-count="10"
      />
    </div>

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-if="messages.length === 0"
        :style="{ gridTemplateColumns: gridTemplate }"
      >
        <TableCell />
        <TableCell class="col-span-5 py-12 text-center text-sm text-grey-500">
          {{
            searchActive
              ? "Try changing your search term."
              : "No messages found."
          }}
        </TableCell>
      </TableRow>

      <template v-else>
        <TableRow
          v-for="row in messages"
          :key="row.id"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <TableCell class="flex items-center" @click.stop>
            <Checkbox
              :model-value="selectedSet.has(row.id)"
              :aria-label="`Select ${row.message}`"
              @update:model-value="toggleRow(row.id, $event)"
            />
          </TableCell>
          <TableCell>
            <p v-if="row.subject" class="text-sm font-semibold text-grey-900">
              {{ row.subject }}
            </p>
            <p class="line-clamp-2 text-sm text-grey-700">{{ row.message }}</p>
          </TableCell>
          <TableCell>
            <div class="inline-flex items-center gap-2 text-sm text-grey-700">
              <Mail
                v-if="row.type === 'email'"
                class="size-4 text-primary-500"
              />
              <Bell v-else class="size-4 text-warning-600" />
              {{ typeLabel(row.type) }}
            </div>
          </TableCell>
          <TableCell>
            <StatusTag :variant="statusVariant(row.status)" size="medium">
              {{ statusLabel(row.status) }}
            </StatusTag>
          </TableCell>
          <TableCell>
            <p class="text-sm text-grey-700">{{ formatDate(row.createdAt) }}</p>
          </TableCell>
          <TableCell @click.stop>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  size="icon"
                  variant="ghost"
                  class="!size-9 !rounded-full !border !border-grey-50 !bg-white !p-0"
                  :disabled="busyMessageId === row.id"
                  aria-label="Message actions"
                >
                  <LoaderCircle
                    v-if="busyMessageId === row.id"
                    class="size-4 animate-spin text-primary-500"
                  />
                  <Ellipsis v-else class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-52">
                <DropdownMenuItem
                  v-if="row.type === 'email'"
                  :disabled="
                    busyMessageId === row.id || row.status === 'pending'
                  "
                  @select="emit('resend', row)"
                >
                  Resend message
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-else
                  :disabled="busyMessageId === row.id"
                  @select="emit('edit', row)"
                >
                  Edit message
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-if="row.type === 'alert'"
                  :disabled="busyMessageId === row.id"
                  @select="emit('toggleStatus', row)"
                >
                  {{
                    row.status === "active"
                      ? "Deactivate message"
                      : "Activate message"
                  }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="text-negative-500"
                  :disabled="
                    busyMessageId === row.id || row.status === 'pending'
                  "
                  @select="emit('delete', row.id)"
                >
                  Delete message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </template>
    </TableBody>

    <TableFooter
      v-if="!loading && meta.total > 0"
      class="border-x border-b border-grey-50"
    >
      <PaginationBar
        :page="meta.page"
        :page-size="meta.limit"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
