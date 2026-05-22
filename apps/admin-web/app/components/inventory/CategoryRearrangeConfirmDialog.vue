<script setup lang="ts">
import { Button } from '@gosource/ui';
import InventoryCategoryOverlay from '~/components/inventory/InventoryCategoryOverlay.vue';

const open = defineModel<boolean>('open', { default: false });

defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
}>();
</script>

<template>
  <InventoryCategoryOverlay
    v-model:open="open"
    title="Save arrangement"
    dialog-class="w-[min(92vw,480px)]"
  >
    <p class="text-sm leading-6 text-grey-600">
      Once saved, the arrangement you specified will reflect on the GoSource market.
    </p>

    <template #footer>
      <Button
        type="button"
        variant="outline"
        size="small"
        :disabled="loading"
        @click="open = false"
      >
        Cancel
      </Button>
      <Button
        type="button"
        size="small"
        :loading="loading"
        :disabled="loading"
        @click="emit('confirm')"
      >
        Save arrangement
      </Button>
    </template>
  </InventoryCategoryOverlay>
</template>
