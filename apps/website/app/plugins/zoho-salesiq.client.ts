/**
 * Zoho SalesIQ live chat — same widget as the live gosource.app marketing site.
 */
export default defineNuxtPlugin(() => {
  const w = window as Window & {
    $zoho?: {
      salesiq?: {
        ready?: () => void;
      };
    };
  };

  w.$zoho = w.$zoho || {};
  w.$zoho.salesiq = w.$zoho.salesiq || {
    ready() {},
  };

  if (document.getElementById('zsiqscript')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'zsiqscript';
  script.defer = true;
  script.src =
    'https://salesiq.zohopublic.com/widget?wc=siq9886695dafae93fd86f964e3c6aceafb2521a69368e96512a8cf6f20f1b859f2';
  document.head.appendChild(script);
});
