import { toast } from '@gosource/ui';
import { ADMIN_LIST_CACHE_URLS } from '~/lib/admin-list-cache-urls';
import { invalidateAdminListCaches } from '~/lib/invalidate-admin-list-cache';
import type {
  AdminAlertPayload,
  CreateAdminEmailPayload,
} from '~/types/messages';

export function useMessageMutations() {
  const busyMessageId = ref<string | null>(null);

  function invalidateMessages() {
    invalidateAdminListCaches([
      ADMIN_LIST_CACHE_URLS.messages,
      ADMIN_LIST_CACHE_URLS.messageStats,
    ]);
  }

  async function createMessage(
    payload: CreateAdminEmailPayload | (AdminAlertPayload & { type: 'alert' }),
  ) {
    busyMessageId.value = 'create';
    try {
      const response = await $fetch('/api/messages', {
        method: 'POST',
        body: payload,
      });
      invalidateMessages();
      toast.success(
        payload.type === 'email'
          ? 'Email queued successfully'
          : 'Alert created',
      );
      return response;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to create message',
      );
      throw error;
    } finally {
      busyMessageId.value = null;
    }
  }

  async function updateAlert(id: string, payload: AdminAlertPayload) {
    busyMessageId.value = id;
    try {
      const url: string = `/api/messages/${id}`;
      const response = await $fetch(url, {
        method: 'PATCH',
        body: payload,
      });
      invalidateMessages();
      toast.success('Alert updated');
      return response;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to update alert',
      );
      throw error;
    } finally {
      busyMessageId.value = null;
    }
  }

  async function runMessageAction(
    id: string,
    action: 'activate' | 'deactivate' | 'resend',
  ) {
    busyMessageId.value = id;
    try {
      const url: string = `/api/messages/${id}/${action}`;
      await $fetch(url, {
        method: 'PATCH',
        body: {},
      });
      invalidateMessages();
      toast.success(
        action === 'resend'
          ? 'Email queued for resend'
          : action === 'activate'
            ? 'Alert activated'
            : 'Alert deactivated',
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Unable to ${action} message`,
      );
      throw error;
    } finally {
      busyMessageId.value = null;
    }
  }

  async function deleteMessage(id: string) {
    busyMessageId.value = id;
    try {
      const url: string = `/api/messages/${id}`;
      await $fetch(url, { method: 'DELETE', body: {} });
      invalidateMessages();
      toast.success('Message deleted');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete message',
      );
      throw error;
    } finally {
      busyMessageId.value = null;
    }
  }

  return {
    busyMessageId,
    createMessage,
    updateAlert,
    runMessageAction,
    deleteMessage,
  };
}
