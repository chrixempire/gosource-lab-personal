import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';

const PAGE_DESCRIPTIONS: Record<string, string> = {
  [ADMIN_PAGE_ROUTES.HOME]:
    'Overview of orders, customers, and product performance.',
  [ADMIN_PAGE_ROUTES.ORDERS]:
    'Search, filter, and manage customer orders.',
  [ADMIN_PAGE_ROUTES.INVENTORY]:
    'Browse, filter, and manage catalogue products.',
  [ADMIN_PAGE_ROUTES.INVENTORY_CATEGORY]:
    'Product categories used to organise your catalogue.',
  [ADMIN_PAGE_ROUTES.PURCHASE_ORDERS]:
    'Create and manage supplier purchase orders, receive stock, and share invoices.',
  [ADMIN_PAGE_ROUTES.INVENTORY_ITEM_CREATE]:
    'Create a catalogue product with images, stock settings, pricing, and optional special prices.',
  [ADMIN_PAGE_ROUTES.CREDIT_ANALYTICS]:
    'Monitor credit portfolio performance and top-performing businesses.',
  [ADMIN_PAGE_ROUTES.CREDIT_APPLICATIONS]:
    'Review and process customer credit applications.',
  [ADMIN_PAGE_ROUTES.CREDIT_REQUESTS]:
    'Review top-up and new credit requests from businesses.',
  [ADMIN_PAGE_ROUTES.CREDIT_REPAYMENTS]:
    'Track customer credit repayments and payment methods.',
  [ADMIN_PAGE_ROUTES.CREDIT_SCHEDULES]:
    'View installment schedules and overdue repayments.',
  [ADMIN_PAGE_ROUTES.DISCOUNTS]:
    'Create and manage coupon discounts for categories, products, orders, and delivery.',
  [ADMIN_PAGE_ROUTES.PROMOTIONS]:
    'Create themed product promotions with optional percentage discounts and date windows.',
  [ADMIN_PAGE_ROUTES.MESSAGES]:
    'Create and manage alert and email messages sent to customers.',
  [ADMIN_PAGE_ROUTES.CUSTOMERS]:
    'Search and manage business and individual customers, credit access, and account details.',
  // [ADMIN_PAGE_ROUTES.ACTIVITY_LOG]:
  //   'Review recorded admin and system actions across products, orders, and operations.',
  [ADMIN_PAGE_ROUTES.SETTINGS]:
    'Manage your profile, security, users, fees, and roles.',
  [ADMIN_PAGE_ROUTES.SETTINGS_SECURITY]:
    'Update your admin account password and security settings.',
  [ADMIN_PAGE_ROUTES.SETTINGS_USERS]:
    'Invite and manage admin users in your workspace.',
  [ADMIN_PAGE_ROUTES.SETTINGS_FEES]:
    'Configure delivery fees and other platform charges.',
  [ADMIN_PAGE_ROUTES.SETTINGS_ROLES]:
    'Create roles and manage permissions for admin users.',
  [ADMIN_PAGE_ROUTES.SETTINGS_ROLE_CREATE]:
    'Define a new admin role and assign permissions.',
};

export function resolveAdminPageDescription(path: string): string | null {
  const pathname = path.split('?')[0] ?? path;
  const exact = PAGE_DESCRIPTIONS[pathname];
  if (exact) {
    return exact;
  }

  if (pathname.startsWith('/inventory/items/edit/')) {
    return 'Update images, stock settings, pricing, and special prices.';
  }

  if (/^\/promotions\/[^/]+$/.test(pathname) && pathname !== '/promotions/create') {
    return 'Update promotion details, discount settings, and linked items.';
  }

  if (pathname.startsWith(`${ADMIN_PAGE_ROUTES.SETTINGS_ROLES}/`) && pathname.endsWith('/edit')) {
    return 'Update role permissions and access for admin users.';
  }

  if (pathname.startsWith(`${ADMIN_PAGE_ROUTES.SETTINGS_ROLES}/`) && pathname.endsWith('/users')) {
    return 'View and manage users assigned to this role.';
  }

  return null;
}
