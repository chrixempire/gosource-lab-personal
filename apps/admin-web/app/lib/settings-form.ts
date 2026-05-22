import type { SettingsRoleFormValues } from '~/types/settings';

export function createEmptyRoleFormValues(): SettingsRoleFormValues {
  return {
    name: '',
    description: '',
    permissions: [],
  };
}

export function validateRoleForm(values: SettingsRoleFormValues) {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = 'Role name is required';
  }

  if (!values.permissions.length) {
    errors.permissions = 'Select at least one permission';
  }

  return errors;
}
