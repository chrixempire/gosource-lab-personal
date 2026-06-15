<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Download, Ellipsis } from 'lucide-vue-next';

defineProps<{
  downloading?: boolean;
}>();

const emit = defineEmits<{
  downloadInvoice: [];
}>();
</script>

<template>
  <div class="shrink-0" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          size="icon"
          variant="ghost"
          class="!size-9 !rounded-full !border !border-grey-50 !bg-background-on-canvas !p-0"
          aria-label="Repayment actions"
          :disabled="downloading"
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-56">
        <DropdownMenuItem class="gap-2.5" @select="emit('downloadInvoice')">
          <Download class="size-4" />
          Download invoice
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
