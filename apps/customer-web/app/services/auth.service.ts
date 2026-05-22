import type {
  CustomerSignupPayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
  VerifyResetOtpPayload,
} from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { extractApiErrorMessage } from '~/utils/api-error';

export function useCustomerAuthService() {
  return {
    async signup(payload: CustomerSignupPayload) {
      try {
        return await $fetch('/api/auth/signup', {
          method: 'POST',
          body: payload,
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to create your business account right now'));
        throw error;
      }
    },
    async resendOtp(email: string) {
      try {
        return await $fetch('/api/auth/resend-otp', {
          method: 'POST',
          body: { email },
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to resend the verification code right now'));
        throw error;
      }
    },
    async verifyOtp(payload: VerifyOtpPayload) {
      try {
        return await $fetch('/api/auth/verify-otp', {
          method: 'POST',
          body: payload,
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to verify the code right now'));
        throw error;
      }
    },
    async sendPasswordEmail(email: string) {
      try {
        return await $fetch('/api/auth/send-password-email', {
          method: 'POST',
          body: { email },
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to send password reset email right now'));
        throw error;
      }
    },
    async verifyPasswordOtp(payload: VerifyResetOtpPayload) {
      try {
        return await $fetch('/api/auth/verify-password-otp', {
          method: 'POST',
          body: payload,
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to verify reset code right now'));
        throw error;
      }
    },
    async resetPassword(payload: ResetPasswordPayload) {
      try {
        return await $fetch('/api/auth/reset-password', {
          method: 'POST',
          body: payload,
        });
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to reset password right now'));
        throw error;
      }
    },
  };
}
