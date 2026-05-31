import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './entities/cart.entity';
import { isValidObjectId, Model } from 'mongoose';
import { Product } from '../product/entities/product.entity';
import { Employee } from '../employee/entities/employee.entity';
import { BusinessCustomer } from '../business/schema/business.schema';
import { Branch } from '../branch/entities/branch.entity';
import { UpdateCartDto } from './dto/update-cart.dto';
import { calculateTotalPrice } from '../utils/helpers';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
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
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  /**
   * Add product to cart.
   *
   * @param cartDetails
   * @returns
   */
  async addProductToCart(
    cartDetails: CreateCartDto,
    businessDetails: any,
  ): Promise<any> {
    const { productId, branchId } = cartDetails;

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not food');
    }

    if (product.inStock === false) {
      throw new BadRequestException('Product out of stock');
    }

    const businessId = await this.getAuthBusinessId(businessDetails.id);

    if (branchId) {
      await this.getOwnedBranch(branchId, businessId.toString());
    }

    const cartQuery: Record<string, unknown> = {
      product: productId,
      business: businessId,
      unit: cartDetails.unit,
    };

    if (branchId) {
      cartQuery.branch = branchId;
    }

    const cartItem: CartDocument = await this.cartModel.findOne(cartQuery);

    if (cartItem) {
      cartItem.quantity += cartDetails.quantity;
      await cartItem.save();

      return {
        status: true,
        message: 'Cart updated successfully',
        data: cartItem,
      };
    }

    const newCartDetails: Record<string, unknown> = {
      business: businessId,
      product: productId,
      cartProduct: product,
      unit: cartDetails.unit,
      quantity: cartDetails.quantity,
    };

    if (branchId) {
      newCartDetails.branch = branchId;
    }

    try {
      const newCartItem: CartDocument =
        await this.cartModel.create(newCartDetails);

      if (newCartItem) {
        return this.buildResponse(newCartItem, 'Cart created successfully');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? '');

      if (message.includes('space quota') || message.includes('WriteConflict')) {
        throw new BadRequestException(
          'Cart could not be updated because database storage is full. Free up space or contact support.',
        );
      }

      throw error;
    }
  }

  /**
   * Get carts.
   *
   * @param employee
   * @returns {object}
   */
  async getCarts(businessDetails: any, branchId: string): Promise<any> {
    const businessId = await this.getAuthBusinessId(businessDetails.id);

    // Create query object with business ID
    const query: any = {
      business: businessId,
    };

    // Only add branch to query if branchId exists
    if (isValidObjectId(branchId)) {
      const branchCheck = await this.branchModel.findOne({
        _id: branchId,
        businessId,
      });

      if (branchCheck) {
        query.branch = branchId;
      }
    }

    const cartItems: CartDocument[] = await this.cartModel
      .find(query)
      .populate('product');

    if (!cartItems || cartItems.length === 0) {
      return {
        status: 'success',
        data: {
          totalPrice: 0,
          cartItems: [],
          count: 0,
        },
      };
    }

    const totalPrice = calculateTotalPrice(cartItems, businessId, true);

    return {
      status: 'success',
      data: {
        totalPrice,
        cartItems,
        count: cartItems.length,
      },
    };
  }

  /**
   * Remove product from cart.
   *
   * @param cartId
   * @returns
   */
  async removeProductFromCart(
    cartId: string,
    businessDetails: any,
  ): Promise<any> {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    const cartItem: CartDocument = await this.cartModel.findOneAndDelete({
      _id: cartId,
      business: businessId,
    });

    if (!cartItem) {
      throw new NotFoundException('No Cart Item found with that ID');
    }

    return this.buildResponse(null, 'Product removed from cart successfully');
  }

  /**
   * Remove all items from cart.
   *
   * @param branchId
   * @returns
   */
  async removeAllItemsFromCart(
    branchId: string,
    businessDetails: any,
  ): Promise<any> {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    await this.getOwnedBranch(branchId, businessId.toString());
    await this.cartModel.deleteMany({ branch: branchId, business: businessId });
    return this.buildResponse(null, 'Cart deleted successfully');
  }

  buildResponse(data: any, message: string = 'successfully') {
    return {
      status: true,
      message,
      data,
    };
  }

  async updateCartItem(
    cartId: string,
    body: UpdateCartDto,
    businessDetails: any,
  ): Promise<any> {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    const cartItem: CartDocument = await this.cartModel.findOne({
      _id: cartId,
      business: businessId,
    });

    if (!cartItem) {
      throw new NotFoundException('No Cart Item found with that ID');
    }

    if (body.quantity <= 0) {
      return this.removeProductFromCart(cartId, businessDetails);
    }

    cartItem.quantity = Number(body.quantity);
    if (body.unit) {
      cartItem.unit = body.unit;
    }
    cartItem.save();

    return this.buildResponse(cartItem, 'Cart updated successfully');
  }

  /**
   * Update cart item quantity.
   *
   * @param cartId,
   * @param quantity,
   * @returns {object}
   */
  async updateCartItemQuantity(
    cartId: string,
    quantity: number,
    businessDetails: any,
  ): Promise<any> {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    const cartItem: CartDocument = await this.cartModel.findOne({
      _id: cartId,
      business: businessId,
    });

    if (!cartItem) {
      throw new NotFoundException('No Cart Item found with that ID');
    }

    cartItem.quantity = Number(quantity);
    cartItem.save();

    return this.buildResponse(cartItem, 'Cart quantity updated successfully');
  }
}
