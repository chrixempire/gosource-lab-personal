<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Check, ChevronDown, Ellipsis, Eye, Pencil, Plus, X, XCircle } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    canApproveReject?: boolean;
    canCancel?: boolean;
    canEdit?: boolean;
    canAddMore?: boolean;
    canReopen?: boolean;
    showApproveAction?: boolean;
    approveLabel?: string;
    showViewDetails?: boolean;
    viewDetailsLabel?: string;
    triggerVariant?: 'icon' | 'primary';
    triggerLabel?: string;
  }>(),
  {
    showApproveAction: true,
    approveLabel: 'Approve request',
    showViewDetails: true,
    viewDetailsLabel: 'View details',
    triggerVariant: 'icon',
    triggerLabel: 'More actions',
  },
);

const emit = defineEmits<{
  viewDetails: [];
  edit: [];
  addMore: [];
  reopen: [];
  approve: [];
  reject: [];
  cancel: [];
}>();

function onMenuSelect(event: Event, action: () => void) {
  event.preventDefault();
  action();
}

const hasVisibleItems = computed(
  () =>
    props.showViewDetails ||
    props.canReopen ||
    props.canEdit ||
    props.canAddMore ||
    (props.canApproveReject && props.showApproveAction) ||
    props.canApproveReject ||
    props.canCancel,
);
</script>

<template>
  <div v-if="hasVisibleItems" class="shrink-0" @click.stop>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          v-if="triggerVariant === 'primary'"
          variant="primary"
          size="small"
          class="!w-auto"
          :right-icon="ChevronDown"
        >
          {{ triggerLabel }}
        </Button>
        <Button
          v-else
          size="icon"
          variant="ghost"
          class="!size-9 !rounded-full !border !border-grey-50 !bg-background-on-canvas !p-0"
          aria-label="Request actions"
        >
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-56">
        <DropdownMenuItem
          v-if="showViewDetails"
          class="gap-2.5"
          @select="emit('viewDetails')"
        >
          <Eye class="size-4" />
          {{ viewDetailsLabel }}
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="canReopen"
          class="gap-2.5"
          @select="emit('reopen')"
        >
          <Pencil class="size-4" />
          Edit order request
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="canEdit"
          class="gap-2.5"
          @select="emit('edit')"
        >
          <Pencil class="size-4" />
          Edit request
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="canAddMore"
          class="gap-2.5"
          @select="onMenuSelect($event, () => emit('addMore'))"
        >
          <Plus class="size-4" />
          Add more items
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="canApproveReject && showApproveAction"
          class="gap-2.5"
          @select="emit('approve')"
        >
          <Check class="size-4" />
          {{ approveLabel }}
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="canApproveReject"
          class="gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!"
          @select="emit('reject')"
        >
          <XCircle class="size-4" />
          Reject request
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="canCancel"
          class="gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!"
          @select="emit('cancel')"
        >
          <X class="size-4" />
          Cancel request
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
