declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function pushToDataLayer(
  event: string,
  data: Record<string, unknown> = {},
) {
  if (!import.meta.client) {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...data });
}

export function paymentSuccessUrl(orderId: string) {
  const params = new URLSearchParams({
    event: 'payment-success',
    oid: orderId,
  });
  return `?${params.toString()}`;
}

