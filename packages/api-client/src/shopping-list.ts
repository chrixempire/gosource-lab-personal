import type { ApiClient } from './client';
import type {
  AddShoppingListItemPayload,
  CreateShoppingListPayload,
  MoveShoppingListItemsPayload,
  ShoppingListListResponse,
  ShoppingListMoveResponse,
  ShoppingListResponse,
  UpdateShoppingListItemPayload,
  UpdateShoppingListPayload,
} from './types';

export function createShoppingListApi(api: ApiClient) {
  return {
    listListsForBranch(branchId: string) {
      return api.get<ShoppingListListResponse>(`/shopping-list/branch/${branchId}`);
    },
    getList(listId: string) {
      return api.get<ShoppingListResponse>(`/shopping-list/${listId}`);
    },
    createList(payload: CreateShoppingListPayload) {
      return api.post<ShoppingListResponse>('/shopping-list', payload);
    },
    updateList(listId: string, payload: UpdateShoppingListPayload) {
      return api.patch<ShoppingListResponse>(`/shopping-list/${listId}`, payload);
    },
    deleteList(listId: string) {
      return api.delete<ShoppingListResponse>(`/shopping-list/${listId}`);
    },
    addItem(listId: string, payload: AddShoppingListItemPayload) {
      return api.post<ShoppingListResponse>(`/shopping-list/${listId}/items`, payload);
    },
    updateItem(listId: string, itemId: string, payload: UpdateShoppingListItemPayload) {
      return api.patch<ShoppingListResponse>(
        `/shopping-list/${listId}/items/${itemId}`,
        payload,
      );
    },
    deleteItem(listId: string, itemId: string) {
      return api.delete<ShoppingListResponse>(`/shopping-list/${listId}/items/${itemId}`);
    },
    clearItems(listId: string) {
      return api.delete<ShoppingListResponse>(`/shopping-list/${listId}/items`);
    },
    moveItems(sourceListId: string, payload: MoveShoppingListItemsPayload) {
      return api.post<ShoppingListMoveResponse>(
        `/shopping-list/${sourceListId}/move-items`,
        payload,
      );
    },
  };
}
