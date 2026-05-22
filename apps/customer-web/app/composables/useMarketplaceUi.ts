/** Shared UI state for marketplace (layout + page) so the shell does not remount on resize. */
export function useMarketplaceUi() {
  const cartDrawerOpen = useState('marketplace-cart-drawer-open', () => false);
  return { cartDrawerOpen };
}
