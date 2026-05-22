import { toast } from '@gosource/ui';
import type { AdminSessionState } from '~/types/admin-session';
import type { SettingsProfileFormValues } from '~/types/settings';

export function useSettingsMutations() {
  const busyKey = ref<string | null>(null);

  async function updateProfile(values: SettingsProfileFormValues) {
    busyKey.value = 'profile';
    try {
      const response = await $fetch<AdminSessionState>('/api/settings/profile', {
        method: 'PATCH',
        body: values,
      });
      toast.success(response.message ?? 'Profile updated');
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update profile';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function changePassword(body: { oldPassword: string; newPassword: string }) {
    busyKey.value = 'password';
    try {
      const response = await $fetch<{ message?: string }>('/api/settings/change-password', {
        method: 'PATCH',
        body,
      });
      toast.success(response.message ?? 'Password updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to change password';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function inviteAdminUser(body: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    callbackUrl: string;
  }) {
    busyKey.value = 'invite';
    try {
      const response = await $fetch<{ message?: string }>('/api/auth/register', {
        method: 'POST',
        body,
      });
      toast.success(response.message ?? 'User invited successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to invite user';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function updateAdminUser(
    adminId: string,
    body: { firstName: string; lastName: string; roleId: string },
  ) {
    busyKey.value = adminId;
    try {
      const response = await $fetch<{ message?: string }>(`/api/admins/${adminId}`, {
        method: 'PATCH',
        body,
      });
      toast.success(response.message ?? 'User updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update user';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function activateAdminUser(adminId: string) {
    busyKey.value = adminId;
    try {
      const response = await $fetch<{ message?: string }>(`/api/admins/${adminId}/activate`, {
        method: 'PATCH',
      });
      toast.success(response.message ?? 'User activated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to activate user';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function suspendAdminUser(adminId: string) {
    busyKey.value = adminId;
    try {
      const response = await $fetch<{ message?: string }>(`/api/admins/${adminId}/suspend`, {
        method: 'PATCH',
      });
      toast.success(response.message ?? 'User suspended');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to suspend user';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function resendAdminInvite(body: { userId: string; callbackUrl: string }) {
    busyKey.value = body.userId;
    try {
      const response = await $fetch<{ message?: string }>('/api/auth/resend-invite', {
        method: 'POST',
        body,
      });
      toast.success(response.message ?? 'Invite resent');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resend invite';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function createRole(body: {
    name: string;
    description: string;
    permissions: string[];
  }) {
    busyKey.value = 'create-role';
    try {
      const response = await $fetch<{ message?: string }>('/api/roles', {
        method: 'POST',
        body,
      });
      toast.success(response.message ?? 'Role created');
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create role';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function updateRole(
    roleId: string,
    body: { name: string; description: string; permissions: string[] },
  ) {
    busyKey.value = roleId;
    try {
      const response = await $fetch<{ message?: string }>(`/api/roles/${roleId}`, {
        method: 'PATCH',
        body,
      });
      toast.success(response.message ?? 'Role updated');
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update role';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function deleteRole(roleId: string) {
    busyKey.value = roleId;
    try {
      const response = await $fetch<{ message?: string }>(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });
      toast.success(response.message ?? 'Role deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete role';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  async function updateDeliveryFee(body: {
    threshold: number;
    baseFee1: number;
    baseFee2: number;
    percentage1: number;
    percentage2: number;
  }) {
    busyKey.value = 'delivery-fee';
    try {
      const response = await $fetch<{ message?: string }>('/api/system-config/delivery-fee', {
        method: 'PATCH',
        body,
      });
      toast.success(response.message ?? 'Delivery fee updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update delivery fee';
      toast.error(message);
      throw error;
    } finally {
      busyKey.value = null;
    }
  }

  return {
    busyKey,
    updateProfile,
    changePassword,
    inviteAdminUser,
    updateAdminUser,
    activateAdminUser,
    suspendAdminUser,
    resendAdminInvite,
    createRole,
    updateRole,
    deleteRole,
    updateDeliveryFee,
  };
}
