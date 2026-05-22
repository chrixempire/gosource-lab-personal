<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '../lib/cn';
import TableBody from './TableBody.vue';
import TableCell from './TableCell.vue';
import TableRow from './TableRow.vue';

type TableSkeletonColumn =
  | {
      kind: 'checkbox';
      class?: HTMLAttributes['class'];
      boxClass?: HTMLAttributes['class'];
    }
  | {
      kind: 'line';
      class?: HTMLAttributes['class'];
      lineClass?: HTMLAttributes['class'];
    }
  | {
      kind: 'stack';
      class?: HTMLAttributes['class'];
      avatar?: boolean;
      avatarClass?: HTMLAttributes['class'];
      lineClass?: HTMLAttributes['class'];
      sublineClass?: HTMLAttributes['class'];
    }
  | {
      kind: 'action';
      class?: HTMLAttributes['class'];
      boxClass?: HTMLAttributes['class'];
    };

interface Props {
  columns: TableSkeletonColumn[];
  gridTemplateColumns: string;
  rowCount?: number;
  rowClass?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  rowCount: 10,
  rowClass: 'min-h-16 py-2.5 bg-white',
});

const rows = computed(() => Array.from({ length: props.rowCount }, (_, index) => index));
</script>

<template>
  <TableBody class="overflow-y-auto">
    <TableRow
      v-for="row in rows"
      :key="row"
      :style="{ gridTemplateColumns: gridTemplateColumns }"
      :class="props.rowClass"
    >
      <TableCell
        v-for="(column, index) in columns"
        :key="`${row}-${index}`"
        :class="column.class"
      >
        <template v-if="column.kind === 'checkbox'">
          <div class="flex items-center justify-center">
            <div
              :class="cn('size-4 animate-pulse rounded-[5px] bg-grey-50', column.boxClass)"
            />
          </div>
        </template>

        <template v-else-if="column.kind === 'line'">
          <div class="flex w-full min-h-0 min-w-0 items-center">
            <div
              :class="
                cn(
                  'h-6 min-h-0 w-full min-w-0 flex-1 animate-pulse rounded bg-grey-50',
                  column.lineClass,
                )
              "
            />
          </div>
        </template>

        <template v-else-if="column.kind === 'stack'">
          <div
            :class="
              cn(
                column.avatar ? 'flex min-h-0 w-full items-center gap-3' : 'min-h-0 w-full',
              )
            "
          >
            <div
              v-if="column.avatar"
              :class="cn('size-8 shrink-0 animate-pulse rounded-full bg-grey-50', column.avatarClass)"
            />
            <div
              :class="
                cn(
                  'grid h-11 min-h-0 w-full grid-rows-[2fr_1fr] gap-1.5',
                  column.avatar && 'min-w-0 flex-1',
                )
              "
            >
              <div
                :class="cn('min-h-0 w-full animate-pulse rounded bg-grey-50', column.lineClass)"
              />
              <div
                :class="cn('min-h-0 w-full animate-pulse rounded bg-grey-50', column.sublineClass)"
              />
            </div>
          </div>
        </template>

        <template v-else-if="column.kind === 'action'">
          <div class="flex items-center">
            <div
              :class="cn('size-9 animate-pulse rounded-full bg-grey-50', column.boxClass)"
            />
          </div>
        </template>
      </TableCell>
    </TableRow>
  </TableBody>
</template>
