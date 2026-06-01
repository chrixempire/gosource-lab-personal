export type MarketBannerTheme = 'insight' | 'reorder' | 'deals';

export type MarketBannerSlide = {
  id: string;
  to: string;
  alt: string;
  title: string;
  subtitle: string;
  cta: string;
  theme: MarketBannerTheme;
};

export const MARKET_BANNER_SLIDES: MarketBannerSlide[] = [
  {
    id: 'business-insight',
    to: '/business-insight',
    alt: 'Business insight — spending trends, branch reports and product breakdown',
    title: 'Business insight',
    subtitle: 'Spending trends, branch reports & product breakdown',
    cta: 'View reports',
    theme: 'insight',
  },
  {
    id: 'order-again',
    to: '/business-insight',
    alt: 'Order again — repeat your last basket in two taps',
    title: 'Order again',
    subtitle: 'Your last basket, ready in two taps',
    cta: 'Add all to cart',
    theme: 'reorder',
  },
  {
    id: 'promotions',
    to: '/market',
    alt: 'Promotions — save on the products you buy every week',
    title: 'Promotions',
    subtitle: 'Save on the products you buy every week',
    cta: 'Shop deals',
    theme: 'deals',
  },
];

export const MARKET_BANNER_ROTATE_MS = 5500;

const THEME_STYLES: Record<
  MarketBannerTheme,
  { panel: string; subtitle: string; cta: string; decor: string }
> = {
  insight: {
    panel:
      'bg-gradient-to-br from-[#0B3D12] via-[#0F5C18] to-[#0F5C18]',
    subtitle: 'text-primary-50/90',
    cta: 'bg-white/20 text-white ring-1 ring-white/25',
    decor: 'text-white/20',
  },
  reorder: {
    panel:
      'bg-gradient-to-br from-[#14532D] via-primary-500 to-[#15803D]',
    subtitle: 'text-emerald-50/90',
    cta: 'bg-white text-primary-800 shadow-sm',
    decor: 'text-white/15',
  },
  deals: {
    panel:
      'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900',
    subtitle: 'text-slate-200/90',
    cta: 'bg-[#F79009] text-white shadow-sm',
    decor: 'text-[#F79009]/25',
  },
};

export function getMarketBannerThemeStyles(theme: MarketBannerTheme) {
  return THEME_STYLES[theme];
}
