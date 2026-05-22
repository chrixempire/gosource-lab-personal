import type {
  AddShoppingListItemPayload,
  CreateShoppingListPayload,
  MoveShoppingListItemsPayload,
  ShoppingListListResponse,
  ShoppingListMoveResponse,
  ShoppingListResponse,
  UpdateShoppingListItemPayload,
  UpdateShoppingListPayload,
} from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { extractApiErrorMessage } from '~/utils/api-error';

export function useCustomerShoppingListService() {
  const { $shoppingListApi } = useNuxtApp();

  return {
    async listListsForBranch(branchId: string) {
      try {
        return (await $shoppingListApi.listListsForBranch(branchId)) as ShoppingListListResponse;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to load lists right now'));
        throw error;
      }
    },
    async getList(listId: string) {
      try {
        return (await $shoppingListApi.getList(listId)) as ShoppingListResponse;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to load list right now'));
        throw error;
      }
    },
    async createList(payload: CreateShoppingListPayload) {
      try {
        return (await $shoppingListApi.createList(payload)) as ShoppingListResponse;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to create list right now'));
        throw error;
      }
    },
    async addItem(listId: string, payload: AddShoppingListItemPayload) {
      try {
        return (await $shoppingListApi.addItem(listId, payload)) as ShoppingListResponse;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to add product to list right now'));
        throw error;
      }
    },
    async updateList(listId: string, payload: UpdateShoppingListPayload) {
      try {
        return (await $shoppingListApi.updateList(listId, payload)) as ShoppingListResponse;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to update list right now'));
        throw error;
      }
    },
    async deleteList(listId: string) {
      try {
        return await $shoppingListApi.deleteList(listId);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to delete list right now'));
        throw error;
      }
    },
    async updateItem(listId: string, itemId: string, payload: UpdateShoppingListItemPayload) {
      try {
        return (await $shoppingListApi.updateItem(listId, itemId, payload)) as ShoppingListResponse;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to update list item right now'));
        throw error;
      }
    },
    async deleteItem(listId: string, itemId: string) {
      try {
        return (await $shoppingListApi.deleteItem(listId, itemId)) as ShoppingListResponse;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to remove list item right now'));
        throw error;
      }
    },
    async clearItems(listId: string) {
      try {
        return await $shoppingListApi.clearItems(listId);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to clear list items right now'));
        throw error;
      }
    },
    async moveItems(sourceListId: string, payload: MoveShoppingListItemsPayload) {
      try {
        return (await $shoppingListApi.moveItems(sourceListId, payload)) as ShoppingListMoveResponse;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to move list items right now'));
        throw error;
      }
    },
  };
}
