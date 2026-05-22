import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AddListItemDto,
  CreateShoppingListDto,
  MoveItemsDto,
  UpdateListItemDto,
} from './dto/shopping-list.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ShoppingListService } from './shopping-list.service';
import { Business } from '../business/decorator/business.decorator';
import { ShoppingList } from './entities/shopping-list.entity';

@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('ShoppingList')
@Controller('shopping-list')
export class ShoppingListController {
  constructor(private shoppingListService: ShoppingListService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Create shopping list.',
    type: ShoppingList,
  })
  @ApiOperation({ summary: 'Create shopping list' })
  async createList(
    @Body() body: CreateShoppingListDto,
    @Business() business: any,
  ) {
    return this.shoppingListService.createList(body, business);
  }

  @Get('branch/:branchId')
  @ApiResponse({
    status: 200,
    description: 'Get all shopping lists.',
    type: [ShoppingList],
  })
  @ApiOperation({ summary: 'Get all branch shopping lists' })
  async getLists(
    @Param('branchId') branchId: string,
    @Business() business: any,
  ) {
    return this.shoppingListService.getLists(branchId, business);
  }

  @Get(':listId')
  @ApiResponse({
    status: 200,
    description: 'Get shopping list.',
    type: ShoppingList,
  })
  @ApiOperation({ summary: 'Get shopping list' })
  async getSingleList(
    @Param('listId') listId: string,
    @Business() business: any,
  ) {
    return this.shoppingListService.getSingleList(listId, business);
  }

  @Patch(':listId')
  @ApiOperation({ summary: 'Update shopping list' })
  async updateList(
    @Param('listId') listId: string,
    @Body() body: CreateShoppingListDto,
    @Business() business: any,
  ) {
    return this.shoppingListService.updateList(listId, body, business);
  }

  @Delete(':listId')
  @ApiOperation({ summary: 'Delete shopping list' })
  async deleteList(@Param('listId') listId: string, @Business() business: any) {
    return this.shoppingListService.deleteList(listId, business);
  }

  @Post(':listId/items')
  @ApiOperation({ summary: 'Add item to shopping list' })
  async addItemToList(
    @Param('listId') listId: string,
    @Body() body: AddListItemDto,
    @Business() business: any,
  ) {
    return this.shoppingListService.addItemToList(listId, body, business);
  }

  @Patch(':listId/items/:itemId')
  @ApiOperation({ summary: 'Update shopping list item' })
  async updateListItem(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateListItemDto,
    @Business() business: any,
  ) {
    return this.shoppingListService.updateItemList(listId, itemId, body, business);
  }

  @Delete(':listId/items/:itemId')
  @ApiOperation({ summary: 'Delete shopping list item' })
  async deleteListItem(
    @Param('listId') listId: string,
    @Param('itemId') itemId: string,
    @Business() business: any,
  ) {
    return this.shoppingListService.deleteListItem(listId, itemId, business);
  }

  @Delete(':listId/items')
  @ApiOperation({ summary: 'Delete all shopping list items' })
  async deleteAllListItems(
    @Param('listId') listId: string,
    @Business() business: any,
  ) {
    return this.shoppingListService.deleteAllListItems(listId, business);
  }

  @Post(':sourceListId/move-items')
  @ApiOperation({ summary: 'Move items from one list to another list' })
  async moveItemsToList(
    @Param('sourceListId') sourceListId: string,
    @Body() body: MoveItemsDto,
    @Business() business: any,
  ) {
    return this.shoppingListService.moveItemsToList(
      sourceListId,
      body.targetListId,
      body.itemIds,
      business,
    );
  }
}
