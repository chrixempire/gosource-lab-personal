<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { cn } from '../lib/cn';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  inheritRadius?: boolean;
  plain?: boolean;
  disabled?: boolean;
  hidePageSize?: boolean;
}>();

const emit = defineEmits<{
  change: [page: number];
  pageSizeChange: [pageSize: number];
}>();

const pageSizeOptions = [10, 25, 50, 100];

const startIndex = computed(() => {
  if (props.totalItems === 0) {
    return 0;
  }

  return (props.page - 1) * props.pageSize + 1;
});

const endIndex = computed(() => Math.min(props.page * props.pageSize, props.totalItems));

const previousDisabled = computed(() => props.hasPrevPage === false || props.page <= 1);
const nextDisabled = computed(() => props.hasNextPage === false || props.page >= props.totalPages);

const SIBLING_COUNT = 1;

function range(start: number, end: number) {
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
}

const pages = computed<(number | 'ellipsis')[]>(() => {
  const total = props.totalPages;
  const current = props.page;
  const totalPageNumbers = SIBLING_COUNT * 2 + 5;

  if (total <= totalPageNumbers) {
    return range(1, total);
  }

  const leftSibling = Math.max(current - SIBLING_COUNT, 1);
  const rightSibling = Math.min(current + SIBLING_COUNT, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + SIBLING_COUNT * 2;
    return [...range(1, leftItemCount), 'ellipsis', total];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + SIBLING_COUNT * 2;
    return [1, 'ellipsis', ...range(total - rightItemCount + 1, total)];
  }

  if (showLeftEllipsis && showRightEllipsis) {
    return [1, 'ellipsis', ...range(leftSibling, rightSibling), 'ellipsis', total];
  }

  return range(1, total);
});

const isCompact = computed(() => props.hidePageSize === true);

const rootClass = computed(() =>
  cn(
    'flex w-full max-w-full min-w-0 flex-col gap-2 bg-white/65 px-3 py-3 backdrop-blur-xl sm:min-h-[4.25rem] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-3 sm:px-4 sm:py-3.5',
    isCompact.value && 'sm:gap-x-2',
    props.plain &&
      '!rounded-none !bg-transparent !backdrop-blur-none px-2 py-2.5 sm:px-3 sm:py-3',
    props.plain && isCompact.value && '!px-2 !py-2',
    props.inheritRadius ? 'rounded-t-none rounded-b-xl py-3 sm:py-3.5' : 'rounded-none',
    props.disabled && 'pointer-events-none opacity-50',
  ),
);

const navButtonClass = computed(() =>
  cn(
    'inline-flex shrink-0 items-center justify-center rounded-md border border-grey-50 bg-white text-grey-300 transition-colors',
    isCompact.value ? 'size-7' : 'size-8',
  ),
);

const ellipsisClass = computed(() =>
  cn(
    'inline-flex shrink-0 items-center justify-center font-medium text-grey-300',
    isCompact.value ? 'size-7 px-0.5 text-xs' : 'size-8 px-0.5 text-sm',
  ),
);

function goTo(page: number) {
  if (props.disabled) {
    return;
  }

  if (page < props.page && previousDisabled.value) {
    return;
  }

  if (page > props.page && nextDisabled.value) {
    return;
  }

  if (page < 1 || page > props.totalPages || page === props.page) {
    return;
  }

  emit('change', page);
}

function isEllipsis(item: number | 'ellipsis'): item is 'ellipsis' {
  return item === 'ellipsis';
}

function pageButtonClass(pageNumber: number) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-md border font-medium transition-colors',
    isCompact.value ? 'size-7 min-w-7 px-0 text-xs' : 'size-8 min-w-8 px-0 text-sm',
    pageNumber === props.page
      ? 'cursor-default border-orange-50 bg-orange-50 text-orange-500'
      : 'cursor-pointer border-transparent bg-transparent text-grey-300 hover:border-orange-500 hover:text-orange-500',
  );
}
</script>

<template>
  <div :class="rootClass" :aria-busy="disabled ? 'true' : undefined">
    <div class="flex min-w-0 shrink-0 items-center">
      <p v-if="totalItems > 0" class="text-sm font-medium text-grey-300">
        <span class="text-grey-900">{{ startIndex }}-{{ endIndex }}</span>
        of
        <span class="text-grey-900">{{ totalItems }}</span>
      </p>

      <DropdownMenu v-if="!hidePageSize">
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-grey-300 transition-colors hover:bg-grey-55"
          >
            <span class="sm:hidden">Per page:</span>
            <span class="hidden sm:inline">Rows per page:</span>
            <span class="text-grey-900">{{ pageSize }}</span>
            <ChevronDown class="size-4 text-grey-300" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" :side-offset="6" class="min-w-[72px]">
          <DropdownMenuItem
            v-for="option in pageSizeOptions"
            :key="option"
            :class="
              cn(
                'justify-center border border-transparent text-sm font-medium transition-colors data-[highlighted]:border-transparent data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-500',
                option === pageSize && 'border-transparent bg-orange-50 text-orange-500',
              )
            "
            @select="!disabled && emit('pageSizeChange', option)"
          >
            {{ option }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div class="flex min-w-0 max-w-full items-center justify-end overflow-x-auto sm:shrink-0">
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          :disabled="previousDisabled"
          :class="
            cn(
              navButtonClass,
              previousDisabled
                ? 'cursor-not-allowed opacity-45'
                : 'cursor-pointer hover:border-orange-500 hover:text-orange-500',
            )
          "
          @click="goTo(page - 1)"
        >
          <ChevronLeft class="size-4" />
        </button>

        <template v-for="(item, index) in pages" :key="`page-${index}-${String(item)}`">
          <span v-if="isEllipsis(item)" :class="ellipsisClass">…</span>
          <button
            v-else
            type="button"
            :class="pageButtonClass(item)"
            @click="goTo(item)"
          >
            {{ item }}
          </button>
        </template>

        <button
          type="button"
          :disabled="nextDisabled"
          :class="
            cn(
              navButtonClass,
              nextDisabled
                ? 'cursor-not-allowed opacity-45'
                : 'cursor-pointer hover:border-orange-500 hover:text-orange-500',
            )
          "
          @click="goTo(page + 1)"
        >
          <ChevronRight class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>
