<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@gosource/ui';
import InventorySearchableSelect from '~/components/inventory/InventorySearchableSelect.vue';
import { useSettingsMutations } from '~/composables/useSettingsMutations';
import { ADMIN_MODAL_TITLE_CLASS } from '~/lib/admin-dialog';
import type { AdminRoleListItem } from '~/types/settings';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  roles: AdminRoleListItem[];
}>();

const emit = defineEmits<{ invited: [] }>();

const { busyKey, inviteAdminUser } = useSettingsMutations();

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  roleId: '',
});

const fieldErrors = reactive<Record<string, string>>({});

const roleOptions = computed(() =>
  props.roles.map((role) => ({ value: role.id, label: role.name })),
);

function reset() {
  form.firstName = '';
  form.lastName = '';
  form.email = '';
  form.roleId = '';
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
}

function validate() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  if (!form.firstName.trim()) fieldErrors.firstName = 'First name is required';
  if (!form.lastName.trim()) fieldErrors.lastName = 'Last name is required';
  if (!form.email.trim()) fieldErrors.email = 'Email is required';
  if (!form.roleId) fieldErrors.roleId = 'Role is required';
  return Object.keys(fieldErrors).length === 0;
}

watch(open, (value) => {
  if (!value) reset();
});

async function onConfirm() {
  if (!validate()) return;
  try {
    await inviteAdminUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      roleId: form.roleId,
      callbackUrl: `${window.location.origin}/auth/setup-profile`,
    });
    open.value = false;
    emit('invited');
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">Invite user</DialogTitle>
      </DialogHeader>
      <DialogBody class="space-y-4">
        <p class="text-sm text-grey-500">
          Enter the user’s email and assign a role to define what they can access on GoSource Admin.
        </p>
        <Input
          v-model="form.firstName"
          label="First Name"
          :invalid="Boolean(fieldErrors.firstName)"
        />
        <Input
          v-model="form.lastName"
          label="Last Name"
          :invalid="Boolean(fieldErrors.lastName)"
        />
        <Input
          v-model="form.email"
          label="Email"
          type="email"
          :invalid="Boolean(fieldErrors.email)"
        />
        <div>
          <p class="mb-2 text-sm font-medium text-grey-900">Role</p>
          <InventorySearchableSelect
            v-model="form.roleId"
            :options="roleOptions"
            placeholder="Select role"
            :invalid="Boolean(fieldErrors.roleId)"
          />
          <p v-if="fieldErrors.roleId" class="mt-1 text-xs text-negative-500">
            {{ fieldErrors.roleId }}
          </p>
        </div>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="secondary" size="small" @click="open = false">
          Cancel
        </Button>
        <Button
          type="button"
          size="small"
          :loading="busyKey === 'invite'"
          @click="onConfirm"
        >
          Invite user
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
