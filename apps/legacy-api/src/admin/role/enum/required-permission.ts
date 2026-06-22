export enum RequiredPermission {
  // INVENTORY MANAGEMENT
  VIEW_INVENTORY_REPORTS = 'view_inventory_reports',
  // <-- PRODUCT -->
  VIEW_PRODUCT = 'view_product',
  CREATE_UPDATE_PRODUCT = 'create_update_product',
  DELETE_PRODUCT = 'delete_product', // super admin only
  ACTIVATE_DEACTIVATE_PRODUCT = 'activate_deactivate_product',
  VIEW_STOCK_COUNTS = 'view_stock_counts',
  MANAGE_STOCK = 'manage_stock',
  DELETE_STOCK_COUNTS = 'delete_stock_counts', // super admin only
  // <-- CATEGORY -->
  REARRANGE_CATEGORY = 'rearrange_category',
  CREATE_UPDATE_CATEGORY = 'create_update_category',
  DELETE_CATEGORY = 'delete_category', // super admin only
  VIEW_CATEGORY = 'view_category',
  // <-- PURCHASE ORDER -->
  VIEW_PURCHASE_ORDERS = 'view_purchase_orders',
  CREATE_UPDATE_PURCHASE_ORDER = 'create_update_purchase_order',
  DELETE_PURCHASE_ORDER = 'delete_purchase_order', // super admin only

  // ORDER MANAGEMENT
  UPDATE_ORDER_ITEMS = 'update_order_items',
  VIEW_ORDER = 'view_order',
  CANCEL_ORDER = 'cancel_order',
  CHANGE_ORDER_STATUS = 'change_order_status',
  CHANGE_PAYMENT_STATUS = 'change_payment_status',

  // DISCOUNT MANAGEMENT
  VIEW_DISCOUNTS = 'view_discounts',
  CREATE_UPDATE_DISCOUNT = 'create_update_discount',
  DELETE_DISCOUNT = 'delete_discount', // super admin only
  ACTIVATE_DEACTIVATE_DISCOUNT = 'activate_deactivate_discount',

  // PROMOTION MANAGEMENT
  VIEW_PROMOTIONS = 'view_promotions',
  CREATE_UPDATE_PROMOTION = 'create_update_promotion',
  DELETE_PROMOTION = 'delete_promotion', // super admin only
  ACTIVATE_DEACTIVATE_PROMOTION = 'activate_deactivate_promotion',

  // MESSAGING
  VIEW_MESSAGES = 'view_messages',
  CREATE_MESSAGES = 'create_messages',
  EDIT_MESSAGES = 'edit_messages',
  RESEND_MESSAGES = 'resend_messages',
  TOGGLE_MESSAGES = 'toggle_messages',
  DELETE_MESSAGES = 'delete_messages',

  // CUSTOMER MANAGEMENT
  VIEW_CUSTOMER = 'view_customer',
  MODIFY_CUSTOMER = 'modify_customer',
  ENABLE_DISABLE_CUSTOMER_CREDIT = 'enable_disable_customer_credit',
  ACTIVATE_DEACTIVATE_CUSTOMER = 'activate_deactivate_customer', // super admin only
  DELETE_CUSTOMER = 'delete_customer', // super admin only

  // ADMIN MANAGEMENT
  VIEW_ADMIN_MEMBERS = 'view_admin_members',
  MANAGE_ADMIN_MEMBERS = 'manage_admin_members',
  DELETE_ADMIN = 'delete_admin', // super admin only
  VIEW_ADMIN_ROLES = 'view_admin_roles',
  CREATE_UPDATE_ADMIN_ROLE = 'create_update_admin_role',
  DELETE_ADMIN_ROLE = 'delete_admin_role', // super admin only
  // SYSTEM SETTINGS
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  // INVOICE MANAGEMENT
  VIEW_INVOICES = 'view_invoices',
  CREATE_INVOICE = 'create_invoice',
  // ACTIVITY LOGS
  VIEW_ACTIVITY_LOGS = 'view_activity_logs',

  // REPORTS AND ANALYTICS
  VIEW_SALES_REPORTS = 'view_sales_reports',
  CREATE_SALES_REPORT = 'create_sales_report',
  UPDATE_SALES_REPORT = 'update_sales_report',
  DELETE_SALES_REPORT = 'delete_sales_report', // super admin only

  // CREDIT MANAGEMENT
  VIEW_CREDIT_ANALYTICS = 'view_credit_analytics',
  VIEW_CREDITS = 'view_credits',
  MANAGE_CREDIT = 'manage_credit',
}
