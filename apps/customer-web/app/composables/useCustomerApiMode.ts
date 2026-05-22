export function useCustomerApiMode() {
  const config = useRuntimeConfig();

  const isLegacyMode = computed(() => config.public.customerApiMode === 'legacy');

  return { isLegacyMode };
}
