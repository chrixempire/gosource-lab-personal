export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const containerId = String(config.public.gtmId ?? '').trim();

  if (!containerId || document.querySelector(`script[data-gtm-id="${containerId}"]`)) {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
  });

  const script = document.createElement('script');
  script.async = true;
  script.dataset.gtmId = containerId;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);
});

