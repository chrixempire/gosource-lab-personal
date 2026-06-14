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
import type { AdminRoleListItem, AdminUserListItem } from '~/types/settings';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  user: AdminUserListItem | null;
  roles: AdminRoleListItem[];
}>();

const emit = defineEmits<{ saved: [] }>();

const { busyKey, updateAdminUser } = useSettingsMutations();

const form = reactive({
  firstName: '',
  lastName: '',
  roleId: '',
});

const fieldErrors = reactive<Record<string, string>>({});

const roleOptions = computed(() =>
  props.roles.map((role) => ({ value: role.id, label: role.name })),
);

watch(
  () => [open.value, props.user] as const,
  ([isOpen, user]) => {
    if (!isOpen || !user) return;
    form.firstName = user.firstName;
    form.lastName = user.lastName;
    form.roleId = user.roleId ?? '';
    Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  },
);

function validate() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  if (!form.firstName.trim()) fieldErrors.firstName = 'First name is required';
  if (!form.lastName.trim()) fieldErrors.lastName = 'Last name is required';
  if (!form.roleId) fieldErrors.roleId = 'Role is required';
  return Object.keys(fieldErrors).length === 0;
}

async function onConfirm() {
  if (!props.user || !validate()) return;
  try {
    await updateAdminUser(props.user.id, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      roleId: form.roleId,
    });
    open.value = false;
    emit('saved');
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle :class="ADMIN_MODAL_TITLE_CLASS">Edit user</DialogTitle>
      </DialogHeader>
      <DialogBody class="space-y-4">
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
        <div>
          <p class="mb-2 text-sm font-medium text-grey-900">Role</p>
          <InventorySearchableSelect
            v-model="form.roleId"
            :options="roleOptions"
            placeholder="Select role"
            :invalid="Boolean(fieldErrors.roleId)"
          />
        </div>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="secondary" size="medium" @click="open = false">
          Cancel
        </Button>
        <Button
          type="button"
          size="medium"
          :loading="user ? busyKey === user.id : false"
          @click="onConfirm"
        >
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
