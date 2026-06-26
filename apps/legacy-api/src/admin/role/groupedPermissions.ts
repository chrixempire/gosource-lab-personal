import { RequiredPermission } from './enum/required-permission';

export const GroupedPermissions = {
  inventory: {
    [RequiredPermission.VIEW_INVENTORY_REPORTS]: 'Can view inventory reports',
    // Product
    [RequiredPermission.VIEW_PRODUCT]: 'Can view product',
    [RequiredPermission.CREATE_UPDATE_PRODUCT]: 'Can create/update product',
    [RequiredPermission.DELETE_PRODUCT]: 'Can delete product',
    [RequiredPermission.ACTIVATE_DEACTIVATE_PRODUCT]:
      'Can activate/deactivate product',
    [RequiredPermission.MANAGE_STOCK]: 'Can manage stock',
    [RequiredPermission.VIEW_STOCK_COUNTS]: 'Can view stock counts',
    [RequiredPermission.DELETE_STOCK_COUNTS]: 'Can delete stock counts',
    // Category
    [RequiredPermission.REARRANGE_CATEGORY]: 'Can rearrange category',
    [RequiredPermission.CREATE_UPDATE_CATEGORY]:
      'Can create and update category',
    [RequiredPermission.DELETE_CATEGORY]: 'Can delete category',
    [RequiredPermission.VIEW_CATEGORY]: 'Can view category',
    // Purchase Order
    [RequiredPermission.VIEW_PURCHASE_ORDERS]: 'Can view purchase orders',
    [RequiredPermission.CREATE_UPDATE_PURCHASE_ORDER]:
      'Can create and update purchase order',
    [RequiredPermission.DELETE_PURCHASE_ORDER]: 'Can delete purchase order',
  },

  order: {
    [RequiredPermission.UPDATE_ORDER_ITEMS]: 'Can update order items',
    [RequiredPermission.VIEW_ORDER]: 'Can view order',
    [RequiredPermission.CANCEL_ORDER]: 'Can cancel order',
    [RequiredPermission.CHANGE_ORDER_STATUS]: 'Can change order status',
    [RequiredPermission.CHANGE_PAYMENT_STATUS]: 'Can change payment status',
  },

  discount: {
    [RequiredPermission.VIEW_DISCOUNTS]: 'Can view discounts',
    [RequiredPermission.CREATE_UPDATE_DISCOUNT]:
      'Can create and update discount',
    [RequiredPermission.DELETE_DISCOUNT]: 'Can delete discount',
    [RequiredPermission.ACTIVATE_DEACTIVATE_DISCOUNT]:
      'Can activate/deactivate discount',
  },

  promotion: {
    [RequiredPermission.VIEW_PROMOTIONS]: 'Can view promotions',
    [RequiredPermission.CREATE_UPDATE_PROMOTION]:
      'Can create and update promotion',
    [RequiredPermission.DELETE_PROMOTION]: 'Can delete promotion',
    [RequiredPermission.ACTIVATE_DEACTIVATE_PROMOTION]:
      'Can activate/deactivate promotion',
  },

  messaging: {
    [RequiredPermission.VIEW_MESSAGES]: 'Can view messages',
    [RequiredPermission.CREATE_MESSAGES]: 'Can create messages',
    [RequiredPermission.EDIT_MESSAGES]: 'Can edit alert messages',
    [RequiredPermission.RESEND_MESSAGES]: 'Can resend email messages',
    [RequiredPermission.TOGGLE_MESSAGES]:
      'Can activate/deactivate alert messages',
    [RequiredPermission.DELETE_MESSAGES]: 'Can delete messages',
  },

  customer: {
    [RequiredPermission.VIEW_CUSTOMER]: 'Can view customer',
    [RequiredPermission.MODIFY_CUSTOMER]: 'Can modify customer information',
    [RequiredPermission.ACTIVATE_DEACTIVATE_CUSTOMER]:
      'Can activate/deactivate customer',
    [RequiredPermission.DELETE_CUSTOMER]: 'Can delete customer',
    [RequiredPermission.ENABLE_DISABLE_CUSTOMER_CREDIT]:
      'Can enable/disable customer credit',
  },

  admin: {
    [RequiredPermission.VIEW_ADMIN_MEMBERS]: 'Can view admin members',
    [RequiredPermission.MANAGE_ADMIN_MEMBERS]: 'Can manage admin members',
    [RequiredPermission.DELETE_ADMIN]: 'Can delete admin',
    [RequiredPermission.VIEW_ADMIN_ROLES]: 'Can view admin roles',
    [RequiredPermission.CREATE_UPDATE_ADMIN_ROLE]:
      'Can create/update admin role',
    [RequiredPermission.DELETE_ADMIN_ROLE]: 'Can delete admin role',
    [RequiredPermission.MANAGE_SYSTEM_SETTINGS]: 'Can manage system settings',
    [RequiredPermission.VIEW_ACTIVITY_LOGS]: 'Can view activity logs',
  },

  report: {
    [RequiredPermission.VIEW_SALES_REPORTS]: 'Can view sales reports',
    [RequiredPermission.CREATE_SALES_REPORT]: 'Can create sales report',
    [RequiredPermission.UPDATE_SALES_REPORT]: 'Can update sales report',
    [RequiredPermission.DELETE_SALES_REPORT]: 'Can delete sales report',
  },

  credit: {
    [RequiredPermission.VIEW_CREDIT_ANALYTICS]: 'Can view credit analytics',
    [RequiredPermission.VIEW_CREDITS]: 'Can view credits',
    [RequiredPermission.MANAGE_CREDIT]: 'Can manage credit',
  },
};
