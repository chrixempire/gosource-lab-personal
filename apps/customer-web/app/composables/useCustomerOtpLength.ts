export function useCustomerOtpLength() {
  const config = useRuntimeConfig();

  return computed(() => (config.public.customerApiMode === 'legacy' ? 4 : 6));
}
