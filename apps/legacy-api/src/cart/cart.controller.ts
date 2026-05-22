import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Business } from '../business/decorator/business.decorator';

@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addProductToCart(
    @Body() createCartDto: CreateCartDto,
    @Business() business: any,
  ) {
    return await this.cartService.addProductToCart(createCartDto, business);
  }

  @Get('/:branchId')
  async getCarts(
    @Business() business: any,
    @Param('branchId') branchId: string,
  ) {
    return await this.cartService.getCarts(business, branchId);
  }

  @Delete('delete/:cartId')
  async removeItemFromCart(
    @Param('cartId') cartId: string,
    @Business() business: any,
  ) {
    return this.cartService.removeProductFromCart(cartId, business);
  }

  @Delete('/:branchId')
  async removeAllItemsFromCart(
    @Param('branchId') branchId: string,
    @Business() business: any,
  ) {
    return await this.cartService.removeAllItemsFromCart(branchId, business);
  }

  @Patch('/:cartId')
  async updateCartItem(
    @Param('cartId') cartId: string,
    @Body() body: UpdateCartDto,
    @Business() business: any,
  ) {
    return await this.cartService.updateCartItem(cartId, body, business);
  }

  // Delete this later
  @Patch('update-quantity/:cartId')
  async updateCartItemQuantity(
    @Param('cartId') cartId: string,
    @Body() updateCartDto: UpdateCartDto,
    @Business() business: any,
  ) {
    return await this.cartService.updateCartItemQuantity(
      cartId,
      updateCartDto.quantity,
      business,
    );
  }
}
