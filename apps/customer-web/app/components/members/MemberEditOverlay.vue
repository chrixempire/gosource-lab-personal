<script setup lang="ts">
import type { BranchRecord, EmployeeMemberDetail, EmployeeRole } from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Check, ChevronDown } from 'lucide-vue-next';
import { useCustomerEmployeeService } from '~/services/employee.service';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

const props = defineProps<{
  open: boolean;
  employeeId: string | null;
  branches: BranchRecord[];
}>();

const emit = defineEmits<{
  saved: [];
  'update:open': [value: boolean];
}>();

const { getEmployee, updateEmployee } = useCustomerEmployeeService();
const isMobile = useMediaQuery('(max-width: 600px)');
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref('');
const emailReadonly = ref('');

const form = reactive({
  firstName: '',
  lastName: '',
  phoneNumber: '',
  role: '' as EmployeeRole | '',
  position: '',
  branchId: '',
});

const branchSearch = ref('');
const roleOptions: { value: EmployeeRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
];

const filteredBranches = computed(() => {
  const query = branchSearch.value.trim().toLowerCase();
  if (!query) {
    return props.branches;
  }
  return props.branches.filter((b) => b.branchName.toLowerCase().includes(query));
});

function applyDetail(detail: EmployeeMemberDetail | null) {
  if (!detail) {
    emailReadonly.value = '';
    form.firstName = '';
    form.lastName = '';
    form.phoneNumber = '';
    form.role = '';
    form.position = '';
    form.branchId = '';
    return;
  }
  emailReadonly.value = detail.email;
  form.firstName = detail.firstName ?? '';
  form.lastName = detail.lastName ?? '';
  form.phoneNumber = detail.phoneNumber ?? '';
  form.role = (detail.role as EmployeeRole) || 'employee';
  form.position = detail.position ?? '';
  form.branchId = detail.branchId ?? '';
}

watch(
  () => [props.open, props.employeeId] as const,
  async ([open, employeeId]) => {
    if (!open || !employeeId) {
      applyDetail(null);
      errorMessage.value = '';
      return;
    }

    loading.value = true;
    errorMessage.value = '';

    try {
      const response = await getEmployee(employeeId);
      applyDetail(response.data ?? null);
    } catch (error) {
      applyDetail(null);
      errorMessage.value = extractApiErrorMessage(error, 'Unable to load member for editing.');
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

function close() {
  emit('update:open', false);
}

async function submit() {
  if (!props.employeeId || loading.value) {
    return;
  }

  saving.value = true;
  errorMessage.value = '';

  try {
    const result = await updateEmployee(props.employeeId, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      role: form.role || undefined,
      position: form.position.trim(),
      branchId: form.branchId || undefined,
    });
    toast.success(extractApiResponseMessage(result, 'Member updated'));
    emit('saved');
    close();
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to save changes.');
  } finally {
    saving.value = false;
  }
}

function selectBranch(branchId: string) {
  form.branchId = branchId;
  branchSearch.value = '';
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <div class="flex flex-col gap-1">
          <DrawerTitle>
            Edit member
          </DrawerTitle>
          <DrawerDescription class="text-[12px] leading-5 text-grey-text">
            Update this member’s profile and branch assignment.
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody class="space-y-4">
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-[10px] bg-grey-55" />
        </div>

        <form v-else class="space-y-4" @submit.prevent="submit">
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Email</span>
            <Input :model-value="emailReadonly" disabled class="opacity-90" />
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">First name</span>
            <Input v-model="form.firstName" :disabled="saving" />
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Last name</span>
            <Input v-model="form.lastName" :disabled="saving" />
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Phone number</span>
            <Input v-model="form.phoneNumber" :disabled="saving" />
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Position</span>
            <Input v-model="form.position" :disabled="saving" />
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Role</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child :disabled="saving">
                <button
                  type="button"
                  class="flex h-10 w-full items-center justify-between rounded-[10px] border border-border-input-default bg-grey-55 px-4 py-2.5 text-left text-[14px] text-grey-900 shadow-none outline-none transition focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12"
                >
                  <span>{{ roleOptions.find((r) => r.value === form.role)?.label ?? 'Select role' }}</span>
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
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Branch</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child :disabled="saving || !branches.length">
                <button
                  type="button"
                  class="flex h-10 w-full items-center justify-between rounded-[10px] border border-border-input-default bg-grey-55 px-4 py-2.5 text-left text-[14px] text-grey-900 shadow-none outline-none transition focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12 disabled:opacity-60"
                >
                  <span class="min-w-0 truncate">
                    {{
                      branches.find((b) => b.id === form.branchId)?.branchName || 'Select branch'
                    }}
                  </span>
                  <ChevronDown class="size-4 shrink-0 text-grey-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="max-h-72 w-[var(--reka-dropdown-menu-trigger-width)] overflow-y-auto">
                <div class="px-2 pb-2 pt-1">
                  <Input
                    :model-value="branchSearch"
                    placeholder="Search branch"
                    class="h-9 bg-background-on-canvas"
                    @update:model-value="branchSearch = $event"
                    @keydown.stop
                  />
                </div>
                <DropdownMenuItem
                  v-for="branch in filteredBranches"
                  :key="branch.id"
                  @select="selectBranch(branch.id)"
                >
                  <div class="flex w-full min-w-0 items-center justify-between gap-3">
                    <span class="min-w-0 truncate">{{ branch.branchName }}</span>
                    <Check v-if="form.branchId === branch.id" class="size-4 shrink-0 text-primary-500" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </label>

          <p
            v-if="errorMessage"
            class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
          >
            {{ errorMessage }}
          </p>
        </form>
      </DrawerBody>

      <DrawerFooter v-if="!loading" class="gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="saving" @click="close">
          Cancel
        </Button>
        <Button size="medium" class="w-full" type="button" :loading="saving" @click="submit">
          Save changes
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Edit member
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Update this member’s profile and branch assignment.
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="space-y-4">
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-[10px] bg-grey-55" />
        </div>

        <form v-else class="space-y-4" @submit.prevent="submit">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2 sm:col-span-2">
              <span class="text-[13px] font-semibold text-grey-text">Email</span>
              <Input :model-value="emailReadonly" disabled class="opacity-90" />
            </label>

            <label class="block space-y-2">
              <span class="text-[13px] font-semibold text-grey-text">First name</span>
              <Input v-model="form.firstName" :disabled="saving" />
            </label>

            <label class="block space-y-2">
              <span class="text-[13px] font-semibold text-grey-text">Last name</span>
              <Input v-model="form.lastName" :disabled="saving" />
            </label>

            <label class="block space-y-2 sm:col-span-2">
              <span class="text-[13px] font-semibold text-grey-text">Phone number</span>
              <Input v-model="form.phoneNumber" :disabled="saving" />
            </label>

            <label class="block space-y-2 sm:col-span-2">
              <span class="text-[13px] font-semibold text-grey-text">Position</span>
              <Input v-model="form.position" :disabled="saving" />
            </label>

            <label class="block space-y-2">
              <span class="text-[13px] font-semibold text-grey-text">Role</span>
              <DropdownMenu>
                <DropdownMenuTrigger as-child :disabled="saving">
                  <button
                    type="button"
                    class="flex h-10 w-full items-center justify-between rounded-[10px] border border-border-input-default bg-grey-55 px-4 py-2.5 text-left text-[14px] text-grey-900 shadow-none outline-none transition focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12"
                  >
                    <span>{{ roleOptions.find((r) => r.value === form.role)?.label ?? 'Select role' }}</span>
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
            </label>

            <label class="block space-y-2">
              <span class="text-[13px] font-semibold text-grey-text">Branch</span>
              <DropdownMenu>
                <DropdownMenuTrigger as-child :disabled="saving || !branches.length">
                  <button
                    type="button"
                    class="flex h-10 w-full items-center justify-between rounded-[10px] border border-border-input-default bg-grey-55 px-4 py-2.5 text-left text-[14px] text-grey-900 shadow-none outline-none transition focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12 disabled:opacity-60"
                  >
                    <span class="min-w-0 truncate">
                      {{
                        branches.find((b) => b.id === form.branchId)?.branchName || 'Select branch'
                      }}
                    </span>
                    <ChevronDown class="size-4 shrink-0 text-grey-300" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="max-h-72 w-[var(--reka-dropdown-menu-trigger-width)] overflow-y-auto">
                  <div class="px-2 pb-2 pt-1">
                    <Input
                      :model-value="branchSearch"
                      placeholder="Search branch"
                      class="h-9 bg-background-on-canvas"
                      @update:model-value="branchSearch = $event"
                      @keydown.stop
                    />
                  </div>
                  <DropdownMenuItem
                    v-for="branch in filteredBranches"
                    :key="branch.id"
                    @select="selectBranch(branch.id)"
                  >
                    <div class="flex w-full min-w-0 items-center justify-between gap-3">
                      <span class="min-w-0 truncate">{{ branch.branchName }}</span>
                      <Check v-if="form.branchId === branch.id" class="size-4 shrink-0 text-primary-500" />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </label>
          </div>

          <p
            v-if="errorMessage"
            class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
          >
            {{ errorMessage }}
          </p>
        </form>
      </DialogBody>

      <DialogFooter v-if="!loading" class="grid grid-cols-2 gap-3">
        <Button variant="neutral" size="medium" class="w-full" :disabled="saving" @click="close">
          Cancel
        </Button>
        <Button size="medium" class="w-full" type="button" :loading="saving" @click="submit">
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
