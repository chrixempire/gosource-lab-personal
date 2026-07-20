import type { CustomerMeResponse } from '@gosource/api-client';
import { isBusinessOwnerSession } from '~/lib/customer-roles';

const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/business-insight':
    'View spending, procurement breakdown, and recent orders for your branches.',
  '/track-orders':
    'View procurement insight and track fulfillment for orders placed after checkout.',
  '/notifications':
    'Stay on top of order, payment, request, and credit updates across your workspace.',
  '/lists':
    'Add products from the market with Add to list, then open a list to view and edit items. Create a request when you are ready.',
  '/branches': "Create and manage your company's branches.",
  '/settings/help-support':
    'Find answers and get support for your workspace here.',
  '/market/recent-orders':
    'Full list of products you have ordered recently for this branch.',
  '/credit':
    'Access credit, view your limit and repayment history, and manage credit requests.',
};

export function resolveCustomerPageDescription(
  path: string,
  session: CustomerMeResponse | null | undefined,
): string | null {
  const exact = PAGE_DESCRIPTIONS[path];
  if (exact) {
    return exact;
  }

  if (path === '/manage-requests') {
    return isBusinessOwnerSession(session)
      ? 'Approve and manage all order requests across your business branches.'
      : 'View and manage order requests you created for your branch.';
  }

  if (path === '/members') {
    const isEmployee = session?.user_type === 'employee';
    return isEmployee
      ? 'Members assigned to your branch.'
      : 'Invite and manage the members assigned to each branch.';
  }

  return null;
}
