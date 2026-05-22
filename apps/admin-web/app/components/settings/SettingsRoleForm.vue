<script setup lang="ts">
import { Button, Input } from '@gosource/ui';
import SettingsPermissionsPanel from '~/components/settings/SettingsPermissionsPanel.vue';
import SettingsRoleFormSkeleton from '~/components/settings/skeletons/SettingsRoleFormSkeleton.vue';
import type { PermissionSection, SettingsRoleFormValues } from '~/types/settings';

const form = defineModel<SettingsRoleFormValues>({ required: true });

defineProps<{
  permissionSections: PermissionSection[];
  permissionsLoading?: boolean;
  pageLoading?: boolean;
  submitLabel?: string;
  loading?: boolean;
  /** When true, submit is handled by the page header (back / save row). */
  hideInlineSubmit?: boolean;
}>();

const emit = defineEmits<{ submit: [] }>();

const fieldErrors = defineModel<Record<string, string>>('fieldErrors', { default: () => ({}) });
</script>

<template>
  <SettingsRoleFormSkeleton v-if="pageLoading" />

  <form
    v-else
    class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
    @submit.prevent="emit('submit')"
  >
    <section
      class="rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
    >
      <h2 class="text-base font-semibold text-grey-900">Role details</h2>
      <div class="mt-5 space-y-4">
        <Input
          v-model="form.name"
          label="Name"
          placeholder="e.g. Operations manager"
          :invalid="Boolean(fieldErrors.name)"
        />
        <p v-if="fieldErrors.name" class="-mt-2 text-xs text-negative-500">{{ fieldErrors.name }}</p>

        <Input
          v-model="form.description"
          label="Description"
          placeholder="Describe what this role can do"
          :invalid="Boolean(fieldErrors.description)"
        />

        <p v-if="fieldErrors.permissions" class="text-xs text-negative-500">
          {{ fieldErrors.permissions }}
        </p>

        <Button
          v-if="!hideInlineSubmit"
          type="submit"
          size="small"
          class="!w-fit"
          :loading="loading"
        >
          {{ submitLabel ?? 'Save role' }}
        </Button>
      </div>
    </section>

    <SettingsPermissionsPanel
      v-model="form.permissions"
      :sections="permissionSections"
      :loading="permissionsLoading"
    />
  </form>
</template>
