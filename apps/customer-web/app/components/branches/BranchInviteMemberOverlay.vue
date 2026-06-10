<script setup lang="ts">
import type { BranchRecord, EmployeeInviteData, EmployeeInviteResponse, EmployeeRole } from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  toast,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import { Copy } from 'lucide-vue-next';
import InviteEmployeeForm from '~/components/onboarding/team/InviteEmployeeForm.vue';
import {
  CUSTOMER_FLOATING_CONTENT_Z,
  CUSTOMER_FLOATING_OVERLAY_Z,
} from '~/lib/customer-overlay-z';
import { useCustomerEmployeeService } from '~/services/employee.service';
import { validateEmail } from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

const props = defineProps<{
  open: boolean;
  branch: BranchRecord | null;
  /** When set (e.g. members hub), all branches appear in the picker; selection still defaults to `branch`. */
  branches?: BranchRecord[] | null;
}>();

const emit = defineEmits<{
  invited: [invite: EmployeeInviteResponse['data']];
  'update:open': [value: boolean];
}>();

const { inviteEmployee } = useCustomerEmployeeService();
const isMobile = useMediaQuery('(max-width: 600px)');
const loading = ref(false);
const errorMessage = ref('');
const lastInvite = ref<EmployeeInviteData | null>(null);

const form = reactive({
  email: '',
  role: '' as EmployeeRole | '',
});

const errors = reactive({
  email: '',
  role: '',
  branchId: '',
});

/** Some API payloads expose Mongo `_id` only; the form keys rows by `id`. */
function resolveBranchId(branch: BranchRecord & { _id?: string }): string {
  const fromId = branch.id?.trim?.() ?? '';
  if (fromId) {
    return fromId;
  }
  const raw = branch._id;
  if (typeof raw === 'string') {
    return raw.trim();
  }
  if (raw != null) {
    return String(raw).trim();
  }
  return '';
}

const branchOptions = computed((): BranchRecord[] => {
  const source = props.branches?.length ? props.branches : props.branch ? [props.branch] : [];
  return source.map((b) => {
    const id = resolveBranchId(b as BranchRecord & { _id?: string });
    return id && id !== b.id ? { ...b, id } : b;
  });
});

const inviteBranchId = ref('');

function onInviteBranchId(value: string | undefined) {
  inviteBranchId.value = typeof value === 'string' ? value : '';
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }

    lastInvite.value = null;
    form.email = '';
    form.role = '';
    errors.email = '';
    errors.role = '';
    errors.branchId = '';
    errorMessage.value = '';
    inviteBranchId.value = props.branch ? resolveBranchId(props.branch as BranchRecord & { _id?: string }) : '';
  },
);

function close() {
  emit('update:open', false);
}

function finishInvite() {
  lastInvite.value = null;
  close();
}

async function copyActivationLink() {
  const url = lastInvite.value?.activationUrl;
  if (!url) {
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  } catch {
    toast.error('Could not copy link');
  }
}

async function submit() {
  const branchId = String(inviteBranchId.value ?? '').trim();
  const allowedIds = new Set(branchOptions.value.map((b) => resolveBranchId(b as BranchRecord & { _id?: string })));

  errors.email = validateEmail(form.email);
  errors.role = form.role ? '' : 'Role is required';
  if (!branchId) {
    errors.branchId = 'Select a branch.';
  } else if (!allowedIds.has(branchId)) {
    errors.branchId = 'That branch is no longer available. Pick another branch or refresh.';
  } else {
    errors.branchId = '';
  }

  if (errors.email || errors.role || errors.branchId) {
    errorMessage.value = '';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await inviteEmployee({
      email: form.email,
      role: form.role as EmployeeRole,
      branchId,
      callbackUrl: `${window.location.origin}/auth/invite-user`,
    });

    if (result.data) {
      lastInvite.value = result.data;
      emit('invited', result.data);
      toast.success(extractApiResponseMessage(result, 'Invitation sent'));
    } else {
      close();
    }
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to send invite right now');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent
      :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z"
      :class="['max-h-[92vh]', CUSTOMER_FLOATING_CONTENT_Z]"
    >
      <DrawerHeader>
        <div class="flex flex-col gap-1">
          <DrawerTitle>
            Invite member
          </DrawerTitle>
          <DrawerDescription class="text-[12px] leading-5 text-grey-text">
            Invite a team member to this branch.
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody>
        <InviteEmployeeForm
          v-if="!lastInvite"
          :email="form.email"
          :role="form.role"
          :branch-id="inviteBranchId"
          :branches="branchOptions"
          :loading="loading"
          :email-error="errors.email"
          :role-error="errors.role"
          :branch-error="errors.branchId"
          @update:email="form.email = $event"
          @update:role="form.role = $event"
          @update:branch-id="onInviteBranchId"
          @submit="submit"
        />

        <div v-else class="space-y-4">
          <p class="text-sm leading-6 text-grey-text">
            Email is not set up to send this invite automatically. Share the link below with
            <span class="font-semibold text-grey-900">{{ lastInvite.email }}</span>
            so they can finish creating their account.
          </p>
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Invitation link</span>
            <Input
              readonly
              :model-value="lastInvite.activationUrl"
              class="break-all font-mono text-[12px] leading-5"
            />
          </label>
          <Button
            type="button"
            variant="neutral"
            size="medium"
            class="w-full"
            :left-icon="Copy"
            @click="copyActivationLink"
          >
            Copy link
          </Button>
        </div>

        <p
          v-if="errorMessage && !lastInvite"
          class="mt-4 rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
      </DrawerBody>

      <DrawerFooter v-if="lastInvite">
        <Button size="medium" class="w-full" @click="finishInvite">
          Done
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z" :class="CUSTOMER_FLOATING_CONTENT_Z">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Invite member
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Invite a team member to this branch.
          </DialogDescription>
        </div>

        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody>
        <InviteEmployeeForm
          v-if="!lastInvite"
          :email="form.email"
          :role="form.role"
          :branch-id="inviteBranchId"
          :branches="branchOptions"
          :loading="loading"
          :email-error="errors.email"
          :role-error="errors.role"
          :branch-error="errors.branchId"
          @update:email="form.email = $event"
          @update:role="form.role = $event"
          @update:branch-id="onInviteBranchId"
          @submit="submit"
        />

        <div v-else class="space-y-4">
          <p class="text-sm leading-6 text-grey-text">
            Email is not set up to send this invite automatically. Share the link below with
            <span class="font-semibold text-grey-900">{{ lastInvite.email }}</span>
            so they can finish creating their account.
          </p>
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Invitation link</span>
            <Input
              readonly
              :model-value="lastInvite.activationUrl"
              class="break-all font-mono text-[12px] leading-5"
            />
          </label>
          <Button
            type="button"
            variant="neutral"
            size="medium"
            class="w-full"
            :left-icon="Copy"
            @click="copyActivationLink"
          >
            Copy link
          </Button>
          <Button size="medium" class="w-full" @click="finishInvite">
            Done
          </Button>
        </div>

        <p
          v-if="errorMessage && !lastInvite"
          class="mt-4 rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
      </DialogBody>
    </DialogContent>
  </Dialog>
</template>
