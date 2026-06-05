<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { ChevronDown } from 'lucide-vue-next';

defineProps<{
  isPending?: boolean;
  isRejected?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  reject: [];
  requestMoreInfo: [];
  reopen: [];
}>();

const destructiveItemClass =
  'gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!';
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        type="button"
        variant="outline"
        size="small"
        class="!w-fit shrink-0"
        :right-icon="ChevronDown"
        :disabled="disabled"
      >
        More actions
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-52">
      <DropdownMenuItem v-if="isPending" class="gap-2.5" @select="emit('requestMoreInfo')">
        Request more info
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="isPending"
        :class="destructiveItemClass"
        @select="emit('reject')"
      >
        Reject application
      </DropdownMenuItem>
      <DropdownMenuItem v-if="isRejected" class="gap-2.5" @select="emit('reopen')">
        Reopen application
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
