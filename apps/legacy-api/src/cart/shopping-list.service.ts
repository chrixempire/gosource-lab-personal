import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddListItemDto,
  CreateShoppingListDto,
  UpdateListItemDto,
} from './dto/shopping-list.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShoppingList } from './entities/shopping-list.entity';
import { BusinessCustomer } from '../business/schema/business.schema';
import { Product } from '../product/entities/product.entity';
import { Branch } from '../branch/entities/branch.entity';
import { Employee } from '../employee/entities/employee.entity';
import { successResponse } from '../utils/responses';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectModel(ShoppingList.name)
    private shoppingListModel: Model<ShoppingList>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
  ) {}

  async getAuthBusinessId(businessId: string) {
    const [employee, business] = await Promise.all([
      this.employeeModel.findById(businessId),
      this.businessModel.findById(businessId),
    ]);

    if (!employee && !business) {
      throw new NotFoundException(
        'No employee or business found with this email',
      );
    }

    return employee ? employee.businessId : business.id;
  }

  private async getOwnedBranch(branchId: string, businessId: string) {
    const branch = await this.branchModel.findOne({
      _id: branchId,
      businessId,
    });

    if (!branch) {
      throw new NotFoundException('Branch does not exist');
    }

    return branch;
  }

  private async getOwnedList(id: string, businessId: string) {
    const shoppingList = await this.shoppingListModel.findOne({
      _id: id,
      businessId,
    });

    if (!shoppingList) {
      throw new NotFoundException('Shopping list not found');
    }

    return shoppingList;
  }

  async createList(body: CreateShoppingListDto, businessDetails: any) {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    await this.getOwnedBranch(body.branchId, businessId.toString());

    const shoppingList = await this.shoppingListModel.create({
      ...body,
      businessId,
    });

    return successResponse('Shopping list created successfully', shoppingList);
  }

  async getLists(branchId: string, businessDetails: any) {
    const branch = await this.branchModel.findById(branchId).lean();
    if (!branch) {
      throw new NotFoundException('Branch does not exist');
    }

    const businessId = await this.getAuthBusinessId(businessDetails.id);

    const shoppingLists = await this.shoppingListModel
      .find({ branchId, businessId })
      .populate('items.product')
      .lean();

    return successResponse(
      'Shopping lists fetched successfully',
      shoppingLists,
    );
  }

  async getSingleList(id: string, businessDetails: any) {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    const shoppingList = await this.shoppingListModel
      .findOne({ _id: id, businessId })
      .populate('items.product')
      .lean();
    if (!shoppingList) {
      throw new NotFoundException('Shopping list does not exist');
    }

    return successResponse('Shopping list fetched successfully', shoppingList);
  }

  async updateList(id: string, body: CreateShoppingListDto, businessDetails: any) {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    if (body.branchId) {
      await this.getOwnedBranch(body.branchId, businessId.toString());
    }

    const shoppingLists = await this.shoppingListModel.findOneAndUpdate(
      { _id: id, businessId },
      { $set: { ...body } },
      { new: true },
    );

    if (!shoppingLists) {
      throw new NotFoundException('Shopping list not found');
    }

    return successResponse('Shopping list updated successfully', shoppingLists);
  }

  async addItemToList(id: string, body: AddListItemDto, businessDetails: any) {
    const { productId, ...rest } = body;
    const product = await this.productModel.findById(productId).lean();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.inStock === false) {
      throw new BadRequestException('Product out of stock');
    }

    const businessId = await this.getAuthBusinessId(businessDetails.id);
    const shoppingList = await this.getOwnedList(id, businessId.toString());

    const existingItemIndex = shoppingList.items.findIndex(
      (item) => item.product.toString() === productId.toString(),
    );

    const list =
      existingItemIndex > -1 ? shoppingList.items[existingItemIndex] : null;
    if (list && list.unit === body.unit) {
      shoppingList.items[existingItemIndex].quantity += body.quantity;
    } else {
      shoppingList.items.push({ ...rest, product: productId } as any);
    }

    await shoppingList.save();

    return successResponse(
      existingItemIndex > -1
        ? 'Item updated successfully'
        : 'Item added to shopping list successfully',
      shoppingList,
    );
  }

  async updateItemList(
    id: string,
    itemId: string,
    body: UpdateListItemDto,
    businessDetails: any,
  ) {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    const shoppingList = await this.getOwnedList(id, businessId.toString());

    const itemIndex = shoppingList.items.findIndex(
      (item) => item._id.toString() === itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in shopping list');
    }

    shoppingList.items[itemIndex].quantity = body.quantity;
    if (body.unit) {
      shoppingList.items[itemIndex].unit = body.unit;
    }

    await shoppingList.save();

    return successResponse(
      'Shopping list item updated successfully',
      shoppingList,
    );
  }

  async deleteList(id: string, businessDetails: any) {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    await this.shoppingListModel.deleteOne({
      _id: id,
      businessId,
    });
    return successResponse('Shopping list deleted successfully');
  }

  async deleteAllListItems(id: string, businessDetails: any) {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    await this.shoppingListModel.findOneAndUpdate(
      { _id: id, businessId },
      {
        $set: { items: [] },
      },
      { new: true },
    );

    return successResponse('All items in shopping list deleted successfully');
  }

  async deleteListItem(id: string, itemId: string, businessDetails: any) {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    const shoppingList = await this.getOwnedList(id, businessId.toString());

    shoppingList.items = shoppingList.items.filter(
      (item) => item._id.toString() !== itemId,
    );
    await shoppingList.save();

    return successResponse('Item deleted successfully');
  }

  async moveItemsToList(
    sourceListId: string,
    targetListId: string,
    itemIds: string[],
    businessDetails: any,
  ) {
    // Remove duplicate
    const uniqueItemIds = Array.from(new Set(itemIds));

    const businessId = await this.getAuthBusinessId(businessDetails.id);
    const [sourceList, targetList] = await Promise.all([
      this.shoppingListModel.findOne({
        _id: sourceListId,
        businessId,
      }),
      this.shoppingListModel.findOne({
        _id: targetListId,
        businessId,
      }),
    ]);

    if (!sourceList) {
      throw new NotFoundException('Source list not found');
    }
    if (!targetList) {
      throw new NotFoundException('Target list not found');
    }

    const itemsToMove = sourceList.items.filter((item) =>
      uniqueItemIds.includes(item._id.toString()),
    );

    if (itemsToMove.length !== uniqueItemIds.length) {
      throw new NotFoundException('Some items not found in source list');
    }

    // Remove items from source
    sourceList.items = sourceList.items.filter(
      (item) => !uniqueItemIds.includes(item._id.toString()),
    );

    itemsToMove.forEach((itemToMove) => {
      const existingItemIndex = targetList.items.findIndex(
        (item) =>
          item.product.toString() === itemToMove.product.toString() &&
          item.unit === itemToMove.unit,
      );

      if (existingItemIndex > -1) {
        targetList.items[existingItemIndex].quantity += itemToMove.quantity;
      } else {
        targetList.items.push(itemToMove);
      }
    });

    await Promise.all([sourceList.save(), targetList.save()]);

    return successResponse('Items moved successfully', {
      movedItems: itemsToMove.length,
    });
  }
}
