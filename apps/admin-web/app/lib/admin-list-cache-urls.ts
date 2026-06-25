/** List endpoints backed by `useAdminListFetch` page cache. */
export const ADMIN_LIST_CACHE_URLS = {
  coupons: '/api/coupons',
  promotions: '/api/promotions',
  categories: '/api/categories',
  products: '/api/products/filtered',
  productUnits: '/api/products/units',
  purchaseOrders: '/api/purchase-orders',
  activityLogs: '/api/activity',
  customers: '/api/customers',
  creditApplications: '/api/credit/applications',
  creditRequests: '/api/credit/requests',
  creditRequestStats: '/api/credit/requests/stats',
  creditRepayments: '/api/credit/repayments/payment-history',
  creditRepaymentSchedules: '/api/credit/repayment-schedules',
  creditRepaymentSchedulesOverdue: '/api/credit/repayment-schedules/overdue',
  admins: '/api/admins',
  roles: '/api/roles',
  messages: '/api/messages',
  messageStats: '/api/messages/stats',
} as const;

/**
 * Optional `key` overrides on `useAdminListFetch` that use a different page-cache
 * namespace than the fetch URL. Invalidation must clear both.
 */
export const ADMIN_LIST_CACHE_KEY_ALIASES: Partial<
  Record<
    (typeof ADMIN_LIST_CACHE_URLS)[keyof typeof ADMIN_LIST_CACHE_URLS],
    readonly string[]
  >
> = {
  [ADMIN_LIST_CACHE_URLS.products]: ['inventory-products'],
  [ADMIN_LIST_CACHE_URLS.activityLogs]: ['inventory-activity-log'],
};
