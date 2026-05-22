/** Admin legacy-api OTP codes are 4 digits (`generateOtp` in legacy-api). */
export function useAdminOtpLength() {
  return computed(() => 4);
}
