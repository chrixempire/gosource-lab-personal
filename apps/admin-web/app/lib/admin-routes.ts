export const ADMIN_PAGE_ROUTES = {
  HOME: '/',
  SIGN_IN: '/auth/sign-in',
  RESET_PASSWORD: '/auth/reset-password',
  SETUP_PROFILE: '/auth/setup-profile',
  ORDERS: '/orders',
  INVENTORY: '/inventory',
  INVENTORY_ITEM_CREATE: '/inventory/items/create',
  INVENTORY_CATEGORY: '/inventory/category',
  PURCHASE_ORDERS: '/inventory/purchase-orders',
  CREDIT_ANALYTICS: '/credit/analytics',
  CREDIT_APPLICATIONS: '/credit/application',
  CREDIT_REQUESTS: '/credit/request',
  CREDIT_REPAYMENTS: '/credit/repayment',
  DISCOUNTS: '/discounts',
  PROMOTIONS: '/promotions',
  CUSTOMERS: '/customers',
  SETTINGS: '/settings',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_USERS: '/settings/users',
  SETTINGS_FEES: '/settings/fees-charges',
  SETTINGS_ROLES: '/settings/roles-permissions',
  SETTINGS_ROLE_CREATE: '/settings/roles-permissions/create',
} as const;

export function settingsRoleEditPath(roleId: string) {
  return `${ADMIN_PAGE_ROUTES.SETTINGS_ROLES}/${roleId}/edit`;
}

export function settingsRoleUsersPath(roleId: string) {
  return `${ADMIN_PAGE_ROUTES.SETTINGS_ROLES}/${roleId}/users`;
}

export type AdminNavItem = {
  label: string;
  icon: string;
  to?: string;
  children?: { label: string; to: string }[];
  disabled?: boolean;
};

/** Mirrors reference `gosource-admin-v2` nav sections (Messaging omitted until routed). */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: ADMIN_PAGE_ROUTES.HOME },
  { label: 'Orders', icon: 'i-lucide-shopping-bag', to: ADMIN_PAGE_ROUTES.ORDERS },
  {
    label: 'Inventory',
    icon: 'i-lucide-package',
    children: [
      { label: 'Items', to: ADMIN_PAGE_ROUTES.INVENTORY },
      { label: 'Categories', to: ADMIN_PAGE_ROUTES.INVENTORY_CATEGORY },
      { label: 'Purchase orders', to: ADMIN_PAGE_ROUTES.PURCHASE_ORDERS },
    ],
  },
  {
    label: 'Credit',
    icon: 'i-lucide-badge-percent',
    disabled: true,
    children: [
      { label: 'Analytics', to: ADMIN_PAGE_ROUTES.CREDIT_ANALYTICS },
      { label: 'Applications', to: ADMIN_PAGE_ROUTES.CREDIT_APPLICATIONS },
      { label: 'Credit requests', to: ADMIN_PAGE_ROUTES.CREDIT_REQUESTS },
      { label: 'Repayments', to: ADMIN_PAGE_ROUTES.CREDIT_REPAYMENTS },
    ],
  },
  { label: 'Discounts', icon: 'i-lucide-ticket', to: ADMIN_PAGE_ROUTES.DISCOUNTS },
  { label: 'Promotions', icon: 'i-lucide-megaphone', to: ADMIN_PAGE_ROUTES.PROMOTIONS },
  { label: 'Customers', icon: 'i-lucide-users', to: ADMIN_PAGE_ROUTES.CUSTOMERS },
];

/** Child nav active state — avoids parent + sibling routes sharing `/inventory` prefix. */
export function isAdminNavChildActive(path: string, childTo: string) {
  if (childTo === ADMIN_PAGE_ROUTES.INVENTORY) {
    return path === ADMIN_PAGE_ROUTES.INVENTORY || path.startsWith('/inventory/items');
  }

  if (childTo === ADMIN_PAGE_ROUTES.INVENTORY_CATEGORY) {
    return (
      path === ADMIN_PAGE_ROUTES.INVENTORY_CATEGORY ||
      path.startsWith(`${ADMIN_PAGE_ROUTES.INVENTORY_CATEGORY}/`)
    );
  }

  if (childTo === ADMIN_PAGE_ROUTES.PURCHASE_ORDERS) {
    return (
      path === ADMIN_PAGE_ROUTES.PURCHASE_ORDERS ||
      path.startsWith(`${ADMIN_PAGE_ROUTES.PURCHASE_ORDERS}/`)
    );
  }

  if (childTo === ADMIN_PAGE_ROUTES.HOME) {
    return path === ADMIN_PAGE_ROUTES.HOME;
  }

  return path === childTo || path.startsWith(`${childTo}/`);
}

export function adminNavSectionHasActiveChild(
  path: string,
  children: { to: string }[] | undefined,
) {
  return children?.some((child) => isAdminNavChildActive(path, child.to)) ?? false;
}

export function inventoryItemPath(id: string) {
  return `${ADMIN_PAGE_ROUTES.INVENTORY}/items/${id}`;
}

export function inventoryItemEditPath(id: string) {
  return `${ADMIN_PAGE_ROUTES.INVENTORY}/items/edit/${id}`;
}

export function inventoryCategoryPath(id: string) {
  return `${ADMIN_PAGE_ROUTES.INVENTORY_CATEGORY}/${id}`;
}

export function purchaseOrderCreatePath() {
  return `${ADMIN_PAGE_ROUTES.PURCHASE_ORDERS}/create`;
}

export function purchaseOrderEditPath(id: string) {
  return `${ADMIN_PAGE_ROUTES.PURCHASE_ORDERS}/${id}`;
}

export function discountCreatePath(type: string) {
  return `${ADMIN_PAGE_ROUTES.DISCOUNTS}/${type}`;
}

export function discountEditPath(type: string, id: string) {
  return `${ADMIN_PAGE_ROUTES.DISCOUNTS}/${type}/${id}`;
}

export function customerDetailPath(id: string) {
  return `${ADMIN_PAGE_ROUTES.CUSTOMERS}/${id}`;
}

export function promotionCreatePath() {
  return `${ADMIN_PAGE_ROUTES.PROMOTIONS}/create`;
}

export function promotionEditPath(id: string) {
  return `${ADMIN_PAGE_ROUTES.PROMOTIONS}/${id}`;
}
