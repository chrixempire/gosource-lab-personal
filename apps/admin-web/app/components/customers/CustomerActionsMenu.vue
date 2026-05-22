<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { ChevronDown, Ellipsis } from 'lucide-vue-next';
import type { AdminCustomerListItem } from '~/types/customers';

const props = defineProps<{
  customer: AdminCustomerListItem;
  disabled?: boolean;
  loading?: boolean;
  hideView?: boolean;
  triggerVariant?: 'icon' | 'button';
}>();

const emit = defineEmits<{
  view: [];
  resetPassword: [];
  activate: [];
  deactivateAccount: [];
  deleteAccount: [];
}>();

const destructiveItemClass =
  'text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-[highlighted]:bg-negative-50! data-[highlighted]:text-negative-500! focus:bg-negative-50! focus:text-negative-500!';
</script>

<template>
  <div class="shrink-0" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          :size="triggerVariant === 'button' ? 'small' : 'icon'"
          :variant="triggerVariant === 'button' ? 'primary' : 'ghost'"
          :class="
            triggerVariant === 'button'
              ? '!inline-flex !w-fit shrink-0 !items-center !justify-center'
              : '!size-9 !rounded-full !border !border-grey-50 !bg-white !p-0'
          "
          :disabled="disabled"
          :loading="loading"
          aria-label="Customer actions"
        >
          <template v-if="triggerVariant === 'button'">
            <span class="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span>More actions</span>
              <ChevronDown class="size-4 shrink-0" />
            </span>
          </template>
          <Ellipsis v-else class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-52">
        <DropdownMenuItem v-if="!hideView" class="gap-2.5" @select="emit('view')">
          View details
        </DropdownMenuItem>
        <DropdownMenuItem class="gap-2.5" @select="emit('resetPassword')">
          Reset password
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="customer.status !== 'active'"
          class="gap-2.5"
          @select="emit('activate')"
        >
          Activate
        </DropdownMenuItem>
        <DropdownMenuItem
          v-else
          :class="destructiveItemClass"
          @select="emit('deactivateAccount')"
        >
          Deactivate
        </DropdownMenuItem>
        <DropdownMenuItem :class="destructiveItemClass" @select="emit('deleteAccount')">
          Delete account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
