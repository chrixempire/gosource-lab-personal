import type { BranchRecord, ShoppingListRecord } from '@gosource/api-client';

export interface ShoppingListListItem {
  id: string;
  name: string;
  description: string | null;
  branchId: string;
  branchName: string;
  itemCount: number;
  amount: number;
  updatedAt: string;
  /** First line item image, if any — used as list cover in table/cards. */
  coverImageUrl: string | null;
}

export function branchNameById(branches: BranchRecord[]): Record<string, string> {
  return Object.fromEntries(branches.map((branch) => [branch.id, branch.branchName]));
}

export function listCoverImageUrl(list: ShoppingListRecord): string | null {
  return list.items[0]?.imageUrl ?? null;
}

export function mapShoppingListToListItem(
  list: ShoppingListRecord,
  branchNames: Record<string, string> = {},
): ShoppingListListItem {
  return {
    id: list.id,
    name: list.name,
    description: list.description,
    branchId: list.branchId,
    branchName: branchNames[list.branchId] ?? '—',
    itemCount: list.itemCount,
    amount: shoppingListSubtotal(list),
    updatedAt: list.updatedAt,
    coverImageUrl: listCoverImageUrl(list),
  };
}

export function formatShoppingListDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatShoppingListCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export function shoppingListSubtotal(list: ShoppingListRecord) {
  return list.items.reduce((sum, item) => sum + item.totalPrice, 0);
}
