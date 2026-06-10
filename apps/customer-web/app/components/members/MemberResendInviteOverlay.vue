<script setup lang="ts">
import type { EmployeeInviteData, EmployeeRole } from '@gosource/api-client';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  toast,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import { Check, ChevronDown, Copy } from 'lucide-vue-next';
import { useCustomerEmployeeService } from '~/services/employee.service';
import { validateEmail } from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

const props = defineProps<{
  open: boolean;
  invitationId: string;
  initialEmail: string;
  initialRole: string;
  mode?: 'resend' | 'refresh';
}>();

const emit = defineEmits<{
  resent: [];
  'update:open': [value: boolean];
}>();

const { resendEmployeeInvite, refreshEmployeeInviteLink } = useCustomerEmployeeService();
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
});

const roleOptions: { value: EmployeeRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
];

const actionMode = computed(() => props.mode ?? 'resend');
const isRefreshMode = computed(() => actionMode.value === 'refresh');
const title = computed(() => (isRefreshMode.value ? 'Refresh invite link' : 'Resend invitation'));
const description = computed(() =>
  isRefreshMode.value
    ? 'Generate a fresh setup link for this pending invite. Email delivery is not enabled yet, so you can copy and share the new link manually.'
    : 'Update the email or role if needed, then generate a fresh setup link. Email delivery is not enabled yet — copy the link to share it manually.',
);
const submitLabel = computed(() => (isRefreshMode.value ? 'Generate fresh link' : 'Resend & show link'));
const successMessage = computed(() =>
  isRefreshMode.value ? 'Fresh invite link generated' : 'Invitation resent',
);

function resetForm() {
  lastInvite.value = null;
  form.email = props.initialEmail.trim();
  form.role =
    props.initialRole === 'manager' || props.initialRole === 'employee' ? props.initialRole : 'employee';
  errors.email = '';
  errors.role = '';
  errorMessage.value = '';
}

watch(
  () => [props.open, props.invitationId, props.initialEmail, props.initialRole] as const,
  ([open]) => {
    if (!open) {
      return;
    }
    resetForm();
  },
);

function close() {
  emit('update:open', false);
}

function finishResend() {
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
  if (!props.invitationId) {
    return;
  }

  errors.email = '';
  errors.role = '';

  if (!isRefreshMode.value) {
    errors.email = validateEmail(form.email);
    errors.role = form.role ? '' : 'Role is required';
  }

  if (errors.email || errors.role) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = isRefreshMode.value
      ? await refreshEmployeeInviteLink(props.invitationId)
      : await resendEmployeeInvite(props.invitationId, {
          email: form.email.trim(),
          role: form.role as EmployeeRole,
        });

    if (result.data) {
      lastInvite.value = result.data;
      emit('resent');
      toast.success(extractApiResponseMessage(result, successMessage.value));
    } else {
      close();
    }
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to resend invite right now');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <div class="flex flex-col gap-1">
          <DrawerTitle>
            {{ title }}
          </DrawerTitle>
          <DrawerDescription class="text-[12px] leading-5 text-grey-text">
            {{ description }}
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody>
        <form v-if="!lastInvite && !isRefreshMode" class="space-y-4" @submit.prevent="submit">
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Email address</span>
            <Input
              v-model="form.email"
              type="email"
              placeholder="teammate@business.com"
              autocomplete="email"
              :disabled="loading"
              :invalid="Boolean(errors.email)"
            />
            <p v-if="errors.email" class="text-[12px] font-medium text-negative-500">
              {{ errors.email }}
            </p>
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Role</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child :disabled="loading">
                <button
                  type="button"
                  :class="[
                    'flex h-10 w-full items-center justify-between rounded-[10px] bg-grey-55 px-4 py-2.5 text-left text-[14px] shadow-none outline-none transition disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
                    form.role ? 'text-grey-900' : 'text-grey-400',
                    errors.role
                      ? 'border border-negative-500 focus:border-negative-500 focus:ring-4 focus:ring-negative-500/10'
                      : 'border border-border-input-default focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12',
                  ]"
                >
                  <span>{{ roleOptions.find((item) => item.value === form.role)?.label ?? 'Select role' }}</span>
                  <ChevronDown class="size-4 shrink-0 text-grey-300" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent class="w-[var(--reka-dropdown-menu-trigger-width)]">
                <DropdownMenuItem
                  v-for="option in roleOptions"
                  :key="option.value"
                  @select="form.role = option.value"
                >
                  <div class="flex w-full items-center justify-between gap-3">
                    <span>{{ option.label }}</span>
                    <Check v-if="form.role === option.value" class="size-4 text-primary-500" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p v-if="errors.role" class="text-[12px] font-medium text-negative-500">
              {{ errors.role }}
            </p>
          </label>

          <Button type="submit" size="medium" class="w-full" :loading="loading">
            {{ submitLabel }}
          </Button>
        </form>

        <div v-else-if="!lastInvite" class="space-y-4">
          <p class="text-sm leading-6 text-grey-text">
            We will generate a new invite link for
            <span class="font-semibold text-grey-900">{{ initialEmail }}</span>
            that you can copy and share manually.
          </p>

          <Button type="button" size="medium" class="w-full" :loading="loading" @click="submit">
            {{ submitLabel }}
          </Button>
        </div>

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
        <Button size="medium" class="w-full" @click="finishResend">
          Done
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            {{ title }}
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            {{ description }}
          </DialogDescription>
        </div>

        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody>
        <form v-if="!lastInvite && !isRefreshMode" class="space-y-4" @submit.prevent="submit">
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Email address</span>
            <Input
              v-model="form.email"
              type="email"
              placeholder="teammate@business.com"
              autocomplete="email"
              :disabled="loading"
              :invalid="Boolean(errors.email)"
            />
            <p v-if="errors.email" class="text-[12px] font-medium text-negative-500">
              {{ errors.email }}
            </p>
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Role</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child :disabled="loading">
                <button
                  type="button"
                  :class="[
                    'flex h-10 w-full items-center justify-between rounded-[10px] bg-grey-55 px-4 py-2.5 text-left text-[14px] shadow-none outline-none transition disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
                    form.role ? 'text-grey-900' : 'text-grey-400',
                    errors.role
                      ? 'border border-negative-500 focus:border-negative-500 focus:ring-4 focus:ring-negative-500/10'
                      : 'border border-border-input-default focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12',
                  ]"
                >
                  <span>{{ roleOptions.find((item) => item.value === form.role)?.label ?? 'Select role' }}</span>
                  <ChevronDown class="size-4 shrink-0 text-grey-300" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent class="w-[var(--reka-dropdown-menu-trigger-width)]">
                <DropdownMenuItem
                  v-for="option in roleOptions"
                  :key="option.value"
                  @select="form.role = option.value"
                >
                  <div class="flex w-full items-center justify-between gap-3">
                    <span>{{ option.label }}</span>
                    <Check v-if="form.role === option.value" class="size-4 text-primary-500" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p v-if="errors.role" class="text-[12px] font-medium text-negative-500">
              {{ errors.role }}
            </p>
          </label>

          <Button type="submit" size="medium" class="w-full" :loading="loading">
            {{ submitLabel }}
          </Button>
        </form>

        <div v-else-if="!lastInvite" class="space-y-4">
          <p class="text-sm leading-6 text-grey-text">
            We will generate a new invite link for
            <span class="font-semibold text-grey-900">{{ initialEmail }}</span>
            that you can copy and share manually.
          </p>

          <Button type="button" size="medium" class="w-full" :loading="loading" @click="submit">
            {{ submitLabel }}
          </Button>
        </div>

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
          <Button size="medium" class="w-full" @click="finishResend">
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
