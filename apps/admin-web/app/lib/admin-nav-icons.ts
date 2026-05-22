import type { Component } from 'vue';
import {
  BadgePercent,
  LayoutDashboard,
  Megaphone,
  Package,
  ShoppingBag,
  Ticket,
  Users,
} from 'lucide-vue-next';

export const ADMIN_NAV_ICON_MAP: Record<string, Component> = {
  'i-lucide-layout-dashboard': LayoutDashboard,
  'i-lucide-shopping-bag': ShoppingBag,
  'i-lucide-package': Package,
  'i-lucide-badge-percent': BadgePercent,
  'i-lucide-ticket': Ticket,
  'i-lucide-megaphone': Megaphone,
  'i-lucide-users': Users,
};
