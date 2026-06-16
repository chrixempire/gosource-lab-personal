/** Shared UI state for marketplace (layout + page) so the shell does not remount on resize. */
export function useMarketplaceUi() {
  const cartDrawerOpen = useState('marketplace-cart-drawer-open', () => false);

  async function navigateToMarketAndOpenCart() {
    const route = useRoute();

    if (!route.path.startsWith('/market')) {
      await navigateTo('/market');
      await nextTick();
    }

    cartDrawerOpen.value = true;
  }

  return { cartDrawerOpen, navigateToMarketAndOpenCart };
}
