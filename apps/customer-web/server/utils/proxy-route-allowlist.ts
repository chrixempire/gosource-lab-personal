export type ProxyRouteRule = {
  methods: string[];
  pattern: RegExp;
  allowExplicitAuthorization?: boolean;
};

export const PROXY_ROUTE_RULES: ProxyRouteRule[] = [
  { methods: ['GET'], pattern: /^business$/ },
  { methods: ['PATCH'], pattern: /^business\/change-phone-number$/ },
  { methods: ['PATCH'], pattern: /^business\/change-password$/ },
  { methods: ['POST'], pattern: /^business\/send-otp$/ },
  { methods: ['POST'], pattern: /^business\/verify-otp$/ },
  { methods: ['GET', 'POST'], pattern: /^branch$/ },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^branch\/[^/]+$/ },
  { methods: ['PATCH'], pattern: /^branch\/[^/]+\/(?:activate|deactivate)$/ },
  { methods: ['POST'], pattern: /^employee\/invite$/ },
  { methods: ['GET'], pattern: /^employee\/branch\/[^/]+$/ },
  { methods: ['GET'], pattern: /^employee\/invite\/[^/]+$/, allowExplicitAuthorization: true },
  { methods: ['DELETE'], pattern: /^employee\/invite\/[^/]+$/ },
  { methods: ['POST'], pattern: /^employee\/invite\/[^/]+\/(?:resend|link)$/ },
  { methods: ['POST'], pattern: /^employee\/setup-account$/, allowExplicitAuthorization: true },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^employee\/[^/]+$/ },
  { methods: ['PATCH'], pattern: /^employee\/[^/]+\/(?:deactivate|reactivate)$/ },
  { methods: ['GET', 'POST'], pattern: /^request$/ },
  { methods: ['GET'], pattern: /^request\/[^/]+$/ },
  { methods: ['PATCH'], pattern: /^request\/update-product-quantity$/ },
  { methods: ['PATCH'], pattern: /^request\/add-product\/[^/]+$/ },
  { methods: ['DELETE'], pattern: /^request\/[^/]+\/product\/[^/]+$/ },
  { methods: ['PATCH'], pattern: /^request\/[^/]+$/ },
  { methods: ['PATCH'], pattern: /^request\/[^/]+\/(?:approve|reject|cancel)$/ },
  { methods: ['GET'], pattern: /^category$/ },
  { methods: ['GET'], pattern: /^category\/[^/]+$/ },
  { methods: ['GET'], pattern: /^promotion$/ },
  { methods: ['GET'], pattern: /^promotion\/[^/]+$/ },
  { methods: ['GET'], pattern: /^product\/recent-orders\/[^/]+$/ },
  { methods: ['GET'], pattern: /^product\/[^/]+$/ },
  { methods: ['POST'], pattern: /^cart$/ },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^cart\/[^/]+$/ },
  { methods: ['PATCH'], pattern: /^cart\/update-quantity\/[^/]+$/ },
  { methods: ['DELETE'], pattern: /^cart\/delete\/[^/]+$/ },
  { methods: ['GET', 'POST'], pattern: /^wallet$/ },
  { methods: ['POST'], pattern: /^wallet\/verify-bvn$/ },
  { methods: ['POST'], pattern: /^wallet\/fund$/ },
  { methods: ['GET'], pattern: /^wallet\/transactions$/ },
  { methods: ['GET'], pattern: /^order$/ },
  { methods: ['GET'], pattern: /^order\/summary$/ },
  { methods: ['GET'], pattern: /^order\/[^/]+\/timeline$/ },
  { methods: ['GET'], pattern: /^order\/[^/]+\/invoice$/ },
  { methods: ['GET'], pattern: /^order\/[^/]+$/ },
  { methods: ['POST'], pattern: /^shopping-list$/ },
  { methods: ['GET'], pattern: /^shopping-list\/branch\/[^/]+$/ },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^shopping-list\/[^/]+$/ },
  { methods: ['POST'], pattern: /^shopping-list\/[^/]+\/items$/ },
  { methods: ['DELETE'], pattern: /^shopping-list\/[^/]+\/items$/ },
  { methods: ['PATCH', 'DELETE'], pattern: /^shopping-list\/[^/]+\/items\/[^/]+$/ },
  { methods: ['POST'], pattern: /^shopping-list\/[^/]+\/move-items$/ },
  { methods: ['POST'], pattern: /^request\/shopping-list\/[^/]+$/ },
];

export function getProxyRouteRule(method: string, pathSegments: string[]) {
  const normalizedPath = pathSegments.join('/');
  return PROXY_ROUTE_RULES.find((rule) => rule.methods.includes(method) && rule.pattern.test(normalizedPath)) ?? null;
}
