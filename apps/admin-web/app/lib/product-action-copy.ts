export type ProductActionType = 'activate' | 'deactivate' | 'in-stock' | 'out-of-stock';

export const PRODUCT_ACTION_COPY: Record<
  ProductActionType,
  { title: string; description: string; confirmLabel: string; destructive?: boolean }
> = {
  activate: {
    title: 'Activate item',
    description:
      'This item will be available on the GoSource website for customers to purchase.',
    confirmLabel: 'Activate',
  },
  deactivate: {
    title: 'Deactivate item',
    description:
      'This item will not be available on the GoSource website anymore until it is reactivated.',
    confirmLabel: 'Deactivate',
    destructive: true,
  },
  'in-stock': {
    title: 'Mark as in stock',
    description:
      'This item will be in stock on the GoSource website. Customers will be able to purchase it.',
    confirmLabel: 'Mark in stock',
  },
  'out-of-stock': {
    title: 'Mark as out of stock',
    description:
      'This item will be out of stock on the GoSource website. Customers will not be able to purchase it.',
    confirmLabel: 'Mark out of stock',
    destructive: true,
  },
};
