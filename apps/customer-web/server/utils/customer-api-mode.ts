import { createError, type H3Event } from 'h3';

type RuntimeConfigShape = {
  customerApiMode?: string;
  legacyApiBaseUrl?: string;
  public: {
    apiBaseUrl: string;
  };
};

export function isLegacyCustomerApiMode(event: H3Event) {
  const config = useRuntimeConfig(event) as RuntimeConfigShape;
  return config.customerApiMode === 'legacy';
}

export function getCustomerApiBaseUrl(event: H3Event) {
  const config = useRuntimeConfig(event) as RuntimeConfigShape;

  if (isLegacyCustomerApiMode(event)) {
    if (!config.legacyApiBaseUrl?.trim()) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Legacy API base URL is not configured',
      });
    }

    return `${config.legacyApiBaseUrl.replace(/\/$/, '')}/v2`;
  }

  return config.public.apiBaseUrl.replace(/\/$/, '');
}
