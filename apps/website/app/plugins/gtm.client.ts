/**
 * Google Tag Manager — same container as the live gosource.app marketing site.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const gtmId = String(config.public.gtmId || 'GTM-TMKBCG7P');

  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  if (document.getElementById('gtm-script')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'gtm-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);
});
