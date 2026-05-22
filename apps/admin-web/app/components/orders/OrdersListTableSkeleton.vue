<script setup lang="ts">
import { TableSkeleton } from '@gosource/ui';
import {
  ORDER_TABLE_GRID_TEMPLATE,
  ORDER_TABLE_SKELETON_COLUMNS,
} from '~/lib/orders-table-layout';

withDefaults(
  defineProps<{
    rowCount?: number;
  }>(),
  {
    rowCount: 10,
  },
);
</script>

<template>
  <TableSkeleton
    :columns="ORDER_TABLE_SKELETON_COLUMNS"
    :grid-template-columns="ORDER_TABLE_GRID_TEMPLATE"
    :row-count="rowCount"
  />
</template>
