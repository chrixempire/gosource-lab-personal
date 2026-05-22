import type {
  AdminCompleteSignupPayload,
  AdminLoginPayload,
  AdminPasswordResetCompletePayload,
  AdminPasswordResetRequestPayload,
  AdminVerifyOtpPayload,
} from '@gosource/api-client';
import type { AdminSessionState } from '~/types/admin-session';

type ApiMessageResponse = {
  message?: string;
  [key: string]: unknown;
};

export function useAdminAuthService() {
  return {
    async login(payload: AdminLoginPayload) {
      return await $fetch<AdminSessionState>('/api/auth/session/login', {
        method: 'POST',
        body: payload,
        credentials: 'same-origin',
      });
    },

    async fetchSession() {
      return await $fetch<AdminSessionState>('/api/auth/session/me', {
        credentials: 'same-origin',
      });
    },

    async logout() {
      return await $fetch('/api/auth/session/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    },

    async initiatePasswordReset(payload: AdminPasswordResetRequestPayload) {
      return await $fetch<ApiMessageResponse>('/api/auth/initiate-password-reset', {
        method: 'POST',
        body: payload,
      });
    },

    async verifyPasswordOtp(payload: AdminVerifyOtpPayload) {
      return await $fetch<ApiMessageResponse>('/api/auth/verify-otp', {
        method: 'POST',
        body: payload,
      });
    },

    async completePasswordReset(payload: AdminPasswordResetCompletePayload) {
      return await $fetch<ApiMessageResponse>('/api/auth/complete-password-reset', {
        method: 'POST',
        body: payload,
      });
    },

    async completeAdminSignup(payload: AdminCompleteSignupPayload, token: string) {
      return await $fetch<ApiMessageResponse>('/api/auth/complete-admin-signup', {
        method: 'PATCH',
        body: {
          ...payload,
          token,
        },
      });
    },
  };
}
