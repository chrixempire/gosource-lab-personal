import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, RequestDocument } from './schema/request.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductStockUpdatedEvent } from '../admin/product/events/product-stock-updated.event';
import { ClientSession, Connection, Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  addProductDto,
  CreateRequestDto,
  RejectRequestDto,
  updateQuantityDto,
  UpdateRequestDto,
} from './dto/request.dto';
import { Branch, BranchDocument } from '../branch/entities/branch.entity';
import {
  calculateDeliveryFee,
  calculateFrozenDeliveryFee,
  calculateTotalPrice,
  generateRandomCode,
} from '../utils/helpers';
import { Cart, CartDocument } from '../cart/entities/cart.entity';
import {
  PaymentMethod,
  PaymentStatus,
  RequestStatus,
} from './enum/request.enum';
import { Order, OrderDocument } from '../order/entities/order.entity';
import { ORDER_STATUS } from '../order/interface/order.interface';
import { CouponType } from '../admin/coupon/coupon.enum';
import { QueryParamsDto } from '../analytics/dto/query-param.dto';
import { NewEmailInterface } from '../notification/email/email.interface';
import { EmailService } from '../notification/email/email.service';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../business/schema/business.schema';
import { format } from 'date-fns';
import { Product, ProductDocument } from '../product/entities/product.entity';
import { Employee } from '../employee/entities/employee.entity';
import { IApproveRequest } from './interface/request.interface';
import { Coupon } from '../admin/coupon/schema/coupon.schema';
import { WalletService } from '../wallet/wallet.service';
import {
  IActivityLog,
  INITIATOR_TYPE,
} from '../activity/interface/activityLog.interface';
import { ActivityLog } from '../activity/schema/activityLog.schema';
import { InventoryMovement } from '../product/entities/inventoryMovement.entity';
import { ShoppingList } from '../cart/entities/shopping-list.entity';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { CreditService } from '../credit/credit.service';
import { SystemConfigService } from '../admin/admin/system-config.service';
import { createMoney } from '../utils/money';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(Request.name) private requestModel: Model<Request>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
    private emailService: EmailService,
    @InjectConnection() private readonly connection: Connection,
    private walletService: WalletService,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
    @InjectModel(InventoryMovement.name)
    private inventoryMovementModel: Model<InventoryMovement>,
    @InjectModel(ShoppingList.name)
    private shoppingListModel: Model<ShoppingList>,
    private creditService: CreditService,
    private systemConfigService: SystemConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  private async getAuthBusinessId(authId: string) {
    const [employee, business] = await Promise.all([
      this.employeeModel.findById(authId).lean(),
      this.businessModel.findById(authId).lean(),
    ]);

    if (!employee && !business) {
      throw new NotFoundException('No employee or business found');
    }

    return employee?.businessId?.toString() || business._id.toString();
  }

  private normalizeRequestAddress(address: object | undefined) {
    const input = (address ?? {}) as Record<string, unknown>;

    return {
      streetAddress: String(input.streetAddress ?? ''),
      lga: String(input.lga ?? ''),
      state: String(input.state ?? 'Lagos'),
      directions: String(input.directions ?? input.direction ?? ''),
    };
  }

  private serializeCartLinesForRequest(cart: CartDocument[]) {
    return cart.map((item) => {
      const productRef =
        typeof item.product === 'object' && item.product !== null && '_id' in item.product
          ? item.product._id
          : item.product;

      return {
        _id: item._id ?? randomUUID(),
        business: item.business,
        branch: item.branch,
        product: productRef,
        cartProduct: item.cartProduct,
        quantity: item.quantity,
        unit: item.unit,
        totalPrice: item.totalPrice,
      };
    });
  }

  private requestProductLines(request: { products?: unknown }): any[] {
    return Array.isArray(request.products) ? request.products : [];
  }

  private ensureRequestProductsArray(request: RequestDocument): any[] {
    if (!Array.isArray(request.products)) {
      request.products = [];
    }

    return request.products as any[];
  }

  /** Legacy request lines were stored without ids; mutations require a stable line id. */
  private async ensureRequestProductLineIds(request: RequestDocument) {
    let mutated = false;

    for (const line of this.ensureRequestProductsArray(request) as Array<{ _id?: unknown }>) {
      if (!line._id) {
        line._id = randomUUID();
        mutated = true;
      }
    }

    if (mutated) {
      request.markModified('products');
      await request.save();
    }
  }

  private resolveEntityId(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      const record = value as { _id?: unknown; id?: unknown };
      if (record._id) {
        return String(record._id);
      }
      if (record.id) {
        return String(record.id);
      }
    }

    return String(value);
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

  private async getOwnedShoppingList(listId: string, businessId: string) {
    const shoppingList = await this.shoppingListModel.findOne({
      _id: listId,
      businessId,
    });

    if (!shoppingList) {
      throw new NotFoundException('Shopping list does not exist');
    }

    return shoppingList;
  }

  private async assertRequestBelongsToBusiness(
    request: RequestDocument,
    businessId: string,
  ) {
    const rawBranch = request.branch as BranchDocument | Types.ObjectId | string;
    const branchId =
      rawBranch && typeof rawBranch === 'object' && '_id' in rawBranch
        ? rawBranch._id.toString()
        : rawBranch?.toString?.();

    if (!branchId) {
      throw new UnauthorizedException('You cannot access this request');
    }

    await this.getOwnedBranch(branchId, businessId);
  }

  /**
   * Create a new request.
   *
   * @param requestDetails Details of the request being created
   * @param businessDetails Information about the business initiating the request
   * @returns {object} The newly created request object
   */
  async createRequest(
    requestDetails: CreateRequestDto,
    businessDetails: any,
    listId?: string,
  ): Promise<any> {
    const scopedBusinessId = await this.getAuthBusinessId(businessDetails.id);
    const requestedBranchId = requestDetails.branch ?? requestDetails.branchId;

    if (!listId && !requestedBranchId) {
      throw new BadRequestException('Branch is required to create a request');
    }

    let branch: BranchDocument = null;
    if (requestedBranchId) {
      branch = await this.getOwnedBranch(requestedBranchId, scopedBusinessId);
    }

    if (!listId && !branch) {
      throw new BadRequestException('Branch is required to create a request');
    }

    // Find the employee and business in parallel
    const [employee, business] = await Promise.all([
      this.employeeModel.findById(businessDetails.id).populate('businessId'),
      this.businessModel.findById(businessDetails.id),
    ]);

    let initiator: string;

    // Determine the initiator type (employee or business)
    if (employee) {
      initiator = 'employee';
    } else {
      initiator = 'business';
    }

    // Ensure the employee belongs to the correct branch
    if (employee && branch) {
      if (employee.branchId.toString() !== branch.id) {
        throw new UnauthorizedException(
          'You can not send a request for another branch',
        );
      }
    }

    if (initiator === 'employee' && !employee) {
      throw new UnauthorizedException('Employee not found');
    }

    if (initiator === 'business' && !business) {
      throw new NotFoundException('Business not found');
    }

    const businessId =
      initiator === 'employee'
        ? this.resolveEntityId(employee.businessId)
        : this.resolveEntityId(business._id ?? business.id);

    if (!businessId) {
      throw new BadRequestException('Unable to resolve business for this request');
    }

    const query: any = {
      business: businessId,
    };

    // Only add branch to query if branchId exists
    if (branch) {
      query.branch = branch._id;
    }

    let cart: CartDocument[];

    if (listId) {
      const shoppingList = await this.shoppingListModel
        .findById(listId)
        .populate('items.product')
        .lean();

      if (!shoppingList) {
        throw new NotFoundException('Shopping list does not exist');
      }
      await this.getOwnedShoppingList(listId, scopedBusinessId);

      cart = shoppingList.items as unknown as CartDocument[];
    } else {
      // Retrieve the cart items related to the request
      cart = await this.cartModel.find(query).populate('product');
    }

    // Throw an error if the cart is empty
    if (!cart.length) {
      throw new NotFoundException('No item found in cart');
    }

    // Generate a random reference code for the request
    const reference = generateRandomCode();

    // Calculate the total price of the items in the cart
    const total = calculateTotalPrice(cart, businessId);

    // Ensure the order meets the minimum order amount
    if (total < 25000) {
      throw new BadRequestException('Minimum order is N25,000');
    }

    const frozenFee = calculateFrozenDeliveryFee(cart, total);

    const deliveryFeeConfig = await this.systemConfigService.getConfigByKey(
      'delivery_fee_config',
    );

    const deliveryFee: number =
      frozenFee > 0
        ? frozenFee
        : calculateDeliveryFee(total, deliveryFeeConfig?.value);

    // const businessId =
    //   initiator === 'employee' ? employee.businessId : business.id;

    // // Eat n Go delivery fee
    // if (businessId.toString() === '6814c910c9230f557a42be18') {
    //   deliveryFee = 0;
    // } else {
    //   deliveryFee = frozenFee > 0 ? frozenFee : calculateDeliveryFee(total);
    // }

    // Calculate the delivery fee based on the total price
    requestDetails.deliveryFee = deliveryFee;

    const requestProducts: ProductDocument[] = [];

    // Populate the request products array
    for (const cartItem of cart) {
      // cartProduct doesn't exist when creating request from shopping list
      if (cartItem?.cartProduct) {
        requestProducts.push(cartItem.cartProduct);
        continue;
      }

      const productId = this.resolveEntityId(cartItem.product);
      const product = productId
        ? await this.productModel.findById(productId)
        : null;

      if (!product) {
        throw new NotFoundException('One or more products in the cart no longer exist');
      }

      requestProducts.push(product);
    }

    // Combine request details into a request data object
    const requestData = {
      address: this.normalizeRequestAddress(requestDetails.address),
      phoneNumber: requestDetails.phoneNumber,
      paymentMethod: requestDetails.paymentMethod,
      coupon: requestDetails.coupon,
      deliveryFee: requestDetails.deliveryFee,
      serviceCharge: requestDetails.serviceCharge,
      subtotal: total,
      branch: branch?._id ?? branch?.id ?? requestedBranchId,
      products: this.serializeCartLinesForRequest(cart),
      reference,
      initiator:
        initiator === 'employee'
          ? this.resolveEntityId(employee._id ?? employee.id)
          : this.resolveEntityId(business._id ?? business.id),
      requestProducts,
    };

    let newRequest: RequestDocument;
    try {
      newRequest = await this.requestModel.create(requestData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to persist request';
      throw new BadRequestException(`Request create failed: ${message}`);
    }

    if (newRequest) {
      // Send an email notification if the initiator is an employee
      if (initiator === 'employee' && branch) {
        const businessOwner =
          typeof employee.businessId === 'object' && employee.businessId !== null
            ? employee.businessId
            : await this.businessModel.findById(employee.businessId);

        const ownerEmail =
          businessOwner && typeof businessOwner === 'object' && 'email' in businessOwner
            ? String(businessOwner.email ?? '')
            : '';

        if (ownerEmail) {
          const businessName =
            businessOwner &&
            typeof businessOwner === 'object' &&
            'businessName' in businessOwner
              ? String(businessOwner.businessName ?? '')
              : '';

          const emailData: NewEmailInterface = {
            to: ownerEmail,
            subject: `New Order Request From - ${branch.branchName} - ${reference}`,
            template: 'new-request',
            variables: {
              TIME: format(new Date(), 'hh:mm a'),
              DATE: format(new Date(), 'MMMM d, yyyy'),
              LGA: branch.lga,
              STREET_ADDRESS: branch.streetName,
              PHONE_NUMBER: employee.phoneNumber,
              FULLNAME: `${employee.firstName} ${employee.lastName}`,
              BUSINESS: businessName,
              SUBJECT: `You have a new order request from ${branch.branchName}`,
              BRANCH: branch.branchName,
            },
          };

          this.emailService.sendMail(emailData);
        }
      }

      if (!listId) {
        // Clear the cart after creating the request
        await this.cartModel.deleteMany(query);
      }

      return {
        status: true,
        message: 'Request created successfully',
        data: newRequest,
      };
    }
  }

  /**
   * Update an existing request.
   *
   * @param requestDetails Details to update the request with
   * @param requestId ID of the request to update
   * @returns {object} The updated request object
   */
  async updateRequest(
    requestDetails: UpdateRequestDto,
    requestId: string,
    businessDetails: any,
  ): Promise<any> {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    // Find the request by ID
    const request: RequestDocument =
      await this.requestModel.findById(requestId);

    // Throw an error if the request is not found
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    await this.assertRequestBelongsToBusiness(request, businessId);

    if (requestDetails.branch) {
      await this.getOwnedBranch(requestDetails.branch, businessId);
    }

    // Update the request in the database
    const update = await this.requestModel.findByIdAndUpdate(
      requestId,
      requestDetails,
      { new: true },
    );

    if (update) {
      return {
        status: true,
        message: 'Request updated successfully',
        data: update,
      };
    }
  }

  /**
   * Approve a request.
   *
   * @param requestId ID of the request to approve
   * @param business Business approving the request
   * @param requestDetails Additional details for approval
   * @returns {object} The approved request and associated order
   */
  async approveRequest(
    requestId: string,
    business: any,
    requestDetails: IApproveRequest,
  ): Promise<any> {
    // Start a MongoDB session for transaction management
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // Fetch the request with related documents
      const request: RequestDocument = await this.requestModel
        .findById(requestId)
        .populate('initiator')
        .populate({
          path: 'products.product',
          model: 'Product',
        })
        .populate('branch')
        .session(session)
        .exec();

      // Throw an error if the request is not found
      if (!request) {
        throw new NotFoundException('Request not found');
      }

      // Ensure the request initiator is correct
      if (!request.initiator) {
        const altRequest: RequestDocument =
          await this.requestModel.findById(requestId);
        request.initiator = await this.businessModel.findById(
          altRequest.initiator,
        );

        if (altRequest.initiator._id.toString() !== business.id) {
          throw new UnauthorizedException('You cannot approve this request');
        }
      } else if (request.initiator.businessId?.toString() !== business.id) {
        throw new UnauthorizedException('You cannot approve this request');
      }

      // Fetch the business customer document
      const customer: BusinessCustomerDocument = await this.businessModel
        .findById(business.id)
        .session(session);

      if (!customer) {
        throw new NotFoundException(
          'You can not approve this request. Kindly log in as a business super admin',
        );
      }

      // Ensure the request has not already been approved
      if (request.status === RequestStatus.APPROVED) {
        throw new BadRequestException('Request has already been approved');
      }

      let coupon = false;
      let couponObj: any;

      const deliveryFee = Number(request.deliveryFee ?? 0);
      const discount = this.resolveBillableDiscount(request);
      const subtotal = calculateTotalPrice(request.products, business.id);

      // Validate the coupon if provided
      if (request.coupon) {
        coupon = true;
      }

      let totalPrice = subtotal + deliveryFee - discount;

      let serviceCharge = 0;

      // Handle payment method-specific logic
      if (requestDetails.paymentMethod === PaymentMethod.CREDIT) {
        if (customer.canBuyOnCredit === false) {
          throw new UnauthorizedException(
            `You are not eligible to place an order on credit`,
          );
        }

        // TODO: Uncomment this when all businesses are on the credit system
        // await this.creditService.purchaseFromCredit(
        //   business.id,
        //   totalPrice,
        //   request.reference,
        //   session,
        // );

        // TODO: Remove this when all businesses are on the credit system
        if (customer._id.toString() === '651ec7953d94128bc73a448a') {
          serviceCharge = (2 / 100) * totalPrice; // Papasgrill
        } else if (customer._id.toString() === '6814c910c9230f557a42be18') {
          serviceCharge = (9 / 100) * totalPrice; // Eat n Go
        } else if (customer._id.toString() === '67d98fde9a30a001840d4a7a') {
          serviceCharge = (4 / 100) * totalPrice; // Taimo
        } else {
          serviceCharge = (4 / 100) * totalPrice; // Default 4% service charge for credit purchases
        }

        customer.creditAccount += totalPrice;
        await customer.save({ session });
      }

      if (requestDetails.paymentMethod === PaymentMethod.WALLET) {
        await this.walletService.purchaseFromWallet(
          business.id,
          totalPrice,
          request.reference,
        );
      }

      totalPrice += serviceCharge;

      // Persist the full payable total on the order (subtotal + delivery + service charge).
      // Do not subtract deliveryFee here — clients and reports expect order.totalPrice to match what was charged.

      let paymentStatus = PaymentStatus.PENDING;

      // Determine the payment status based on the payment method
      if (requestDetails.paymentMethod === PaymentMethod.CREDIT) {
        paymentStatus = PaymentStatus.PAID;
      } else if (request.paymentStatus === PaymentStatus.PAID) {
        paymentStatus = PaymentStatus.PAID;
      } else if (requestDetails.paymentMethod === PaymentMethod.WALLET) {
        paymentStatus = PaymentStatus.PAID;
      }

      // Create a new order associated with the approved request
      const newOrder = {
        products: request.products,
        branch: request.branch,
        reference: request.reference,
        address: request.address,
        paymentMethod: requestDetails.paymentMethod,
        phoneNumber: request.phoneNumber,
        coupon: coupon,
        deliveryFee,
        serviceCharge,
        request: request.id,
        business: business.id,
        totalPrice,
        approver: business.id,
        paymentStatus,
        discount: Number(request.discount ?? 0),
        paymentCount:
          requestDetails.paymentMethod === PaymentMethod.TRANSFER ? 0 : 1,
      };

      const order: OrderDocument = new this.orderModel(newOrder);
      await order.save({ session });

      // Deduct product quantity if trackQuantity is enabled
      if (requestDetails.paymentMethod !== PaymentMethod.TRANSFER) {
        this.deductProductQuantity(request.products, business.id);
      }

      // Remove the used coupon if applicable
      if (coupon && couponObj) {
        const code = couponObj.code;
        if (code !== 'Gosource5' || code !== 'GoSource5') {
          await this.couponModel.deleteOne(
            { _id: couponObj?._id },
            { session },
          );
        }
      }

      const address = request.address;

      // Update the request status and payment details
      request.status = RequestStatus.APPROVED;
      request.approver = business.id;
      request.serviceCharge = serviceCharge;
      request.paymentMethod = requestDetails.paymentMethod;
      request.paymentStatus = paymentStatus;
      await request.save({ session });

      await this.addToRecentOrder(request, session);

      // Commit the transaction
      await session.commitTransaction();

      // Send email notifications for the approved request
      if (order) {
        const emailData: NewEmailInterface = {
          to: business.email,
          subject: `Your order ${request.reference} has been created successfully`,
          template: 'new-order',
          variables: {
            TIME: format(new Date(), 'hh:mm a'),
            DATE: format(new Date(), 'MMMM d, yyyy'),
            STATE: address.state,
            LGA: address.lga,
            STREET_ADDRESS: address.streetAddress,
            PHONE_NUMBER: request.phoneNumber,
            FULLNAME: `${customer.firstName} ${customer.lastName}`,
            PAYMENT_METHOD: requestDetails.paymentMethod,
            SERVICE_CHARGE: Intl.NumberFormat().format(serviceCharge),
            DELIVERY_FEE: Intl.NumberFormat().format(request.deliveryFee),
            SUB_TOTAL: Intl.NumberFormat().format(subtotal),
            TOTAL_PRICE: Intl.NumberFormat().format(totalPrice),
            ORDER_ID: order.reference,
            BUSINESS: customer.businessName,
            SUBJECT: `Your order ${request.reference} has been created successfully`,
          },
        };

        this.emailService.sendMail(emailData);

        // Additional email notifications for different recipients
        if (request.initiator._id.toString() !== customer._id.toString()) {
          const emailData: NewEmailInterface = {
            to: request.initiator.email,
            subject: `Your order request ${request.reference} has been approved.`,
            template: 'new-request',
            variables: {
              TIME: format(new Date(), 'hh:mm a'),
              DATE: format(new Date(), 'MMMM d, yyyy'),
              LGA: request.branch.lga,
              STREET_ADDRESS: request.branch.streetName,
              PHONE_NUMBER: request.initiator.phoneNumber,
              FULLNAME: `${request.initiator.firstName} ${request.initiator.lastName}`,
              BUSINESS: request.initiator.firstName,
              SUBJECT: `Your order request ${request.reference} has been approved.`,
              BRANCH: request.branch.branchName,
            },
          };

          this.emailService.sendMail(emailData);

          const emailEmployeeData: NewEmailInterface = {
            to: request.initiator.email,
            subject: `Your order ${request.reference} has been created successfully`,
            template: 'new-order',
            variables: {
              TIME: format(new Date(), 'hh:mm a'),
              DATE: format(new Date(), 'MMMM d, yyyy'),
              STATE: address.state,
              LGA: address.lga,
              STREET_ADDRESS: address.streetAddress,
              PHONE_NUMBER: request.phoneNumber,
              FULLNAME: `${customer.firstName} ${customer.lastName}`,
              PAYMENT_METHOD: requestDetails.paymentMethod,
              SERVICE_CHARGE: Intl.NumberFormat().format(serviceCharge),
              DELIVERY_FEE: Intl.NumberFormat().format(request.deliveryFee),
              SUB_TOTAL: Intl.NumberFormat().format(totalPrice),
              TOTAL_PRICE: Intl.NumberFormat().format(totalPrice),
              ORDER_ID: order.reference,
              BUSINESS: request.initiator.firstName,
              SUBJECT: `Your order ${request.reference} has been created successfully`,
            },
          };

          this.emailService.sendMail(emailEmployeeData);
        }

        // Send notification emails to admins
        if (process.env.NODE_ENV !== 'development') {
          const adminEmails = [
            'lanrebello@ipc-africa.com',
            'nana@ipc-africa.com',
            'mena@ipc-africa.com',
            'newaccounts@ipc-africa.com',
            'vnneji@ipc-africa.com',
            'hanifah@ipc-africa.com',
            'hanifahh@ipc-africa.com',
            'quadrii@ipc-africa.com',
            'adedoyinasumah@gmail.com',
            'jennifer@ipc-africa.com',
            'cynthia.i@ipc-africa.com',
            'sylvia@ipc-africa.com',
          ];

          const subject =
            process.env.NODE_ENV === 'development'
              ? 'An order has been placed [Test Order]'
              : 'An order has been placed';

          for (let i = 0; i < adminEmails.length; i++) {
            const adminEmailData: NewEmailInterface = {
              to: adminEmails[i],
              subject,
              template: 'new-order-admin',
              variables: {
                TIME: format(new Date(), 'hh:mm a'),
                DATE: format(new Date(), 'MMMM d, yyyy'),
                STATE: address.state,
                LGA: address.lga,
                STREET_ADDRESS: address.streetAddress,
                PHONE_NUMBER: request.phoneNumber,
                FULLNAME: `${customer.firstName} ${customer.lastName}`,
                PAYMENT_METHOD: requestDetails.paymentMethod,
                SERVICE_CHARGE: Intl.NumberFormat().format(
                  request.serviceCharge,
                ),
                DELIVERY_FEE: Intl.NumberFormat().format(request.deliveryFee),
                SUB_TOTAL: Intl.NumberFormat().format(totalPrice),
                TOTAL_PRICE: Intl.NumberFormat().format(totalPrice),
                ORDER_ID: order.reference,
                BUSINESS: customer.businessName,
              },
            };

            this.emailService.sendMail(adminEmailData);
          }
        }

        return {
          status: true,
          message: 'Request approved successfully',
          data: { ...request.toObject(), order },
        };
      }
    } catch (error) {
      // Abort the transaction if an error occurs
      await session.abortTransaction();
      throw new HttpException(error.response, error.status);
    } finally {
      // End the session after transaction is complete
      session.endSession();
    }
  }

  async addToRecentOrder(request: RequestDocument, session: ClientSession) {
    const { branch: branchId, products } = request;

    const productIds = products.map((prod) => prod.product._id.toString());
    const branch = await this.branchModel.findById(branchId).session(session);

    if (!branch) return;

    const existingProductIds = (branch.recentOrderProducts || []).map((id) =>
      id.toString(),
    );
    const uniqueProductIds = new Set([...productIds, ...existingProductIds]);
    const updatedProductIds = Array.from(uniqueProductIds).map(
      (id) => new Types.ObjectId(id),
    );
    branch.recentOrderProducts = updatedProductIds.slice(0, 50);

    await branch.save({ session });
  }

  // async deductProductQuantity(
  //   products: { product: ProductDocument; quantity: number; unit: string }[],
  // ): Promise<void> {
  //   for (const item of products) {
  //     const product = item.product;

  //     if (product.trackQuantity) {
  //       const updatedQuantity = product.quantity - item.quantity;
  //       const updatedTotalPrice = product.marketPrice * updatedQuantity;

  //       await this.productModel.updateOne(
  //         { _id: product._id },
  //         {
  //           $set: { quantity: updatedQuantity, totalPrice: updatedTotalPrice },
  //         },
  //       );

  //       const activityLog: IActivityLog = {
  //         objectId: product._id.toString(),
  //         description: `Quantity ${item.quantity} ${product.purchaseUnit} worth ${Intl.NumberFormat().format(item.quantity * product.marketPrice)} of the market price deducted from sales.`,
  //         initiator: null,
  //         initiatorType: INITIATOR_TYPE.ADMIN,
  //         metadata: {},
  //         module: Product.name,
  //       };
  //       await this.activityLogModel.create(activityLog);
  //     }
  //   }
  // }

  async deductProductQuantity(
    products: { product: ProductDocument; quantity: number; unit: string }[],
    businessId: string | null = null,
  ): Promise<void> {
    for (const item of products) {
      const product = item.product;

      if (product.trackQuantity) {
        // Find the conversion factor from newUnit array
        let quantityToDeduct = item.quantity;

        if (product.newUnit) {
          try {
            const newUnits = JSON.parse(product.newUnit);
            const unitMapping = newUnits.find(
              (unitObj: any) => unitObj.unit === item.unit,
            );

            if (unitMapping && unitMapping.quantity) {
              // Convert customer unit to base purchase unit
              // If customer buys 5 "oplo" and 1 oplo = 2 base units, deduct 10 base units
              quantityToDeduct =
                item.quantity * parseFloat(unitMapping.quantity);
            }
          } catch (error) {
            console.error('Error parsing newUnit:', error);
            // Fallback to original quantity if parsing fails
          }
        }

        const quantityToDeductValue = quantityToDeduct;
        const totalDeductionCost = product.marketPrice * quantityToDeductValue;

        // Perform atomic deduction and get updated document
        const updatedProduct = await this.productModel.findByIdAndUpdate(
          product._id,
          {
            $inc: {
              quantity: -quantityToDeductValue,
              totalPrice: -totalDeductionCost,
            },
          },
          { new: true },
        );

        if (updatedProduct) {
          const customerUnitPrice = this.getUnitPrice(
            updatedProduct,
            item.unit,
          );
          const totalCost = item.quantity * customerUnitPrice;

          const movementDescription = `Sale deduction: ${item.quantity} ${item.unit} (equivalent to ${quantityToDeductValue} ${updatedProduct.purchaseUnit}) worth ${createMoney(totalCost, 'naira').format()}. Remaining ${updatedProduct.quantity} quantity.`;
          const activityLogDescription = `Quantity ${item.quantity} ${item.unit} (equivalent to ${quantityToDeductValue} ${updatedProduct.purchaseUnit}) worth ${createMoney(totalCost, 'naira').format()} deducted from sales. Remaining ${updatedProduct.quantity} quantity.`;

          this.eventEmitter.emit(
            'product.stock.updated',
            new ProductStockUpdatedEvent(
              updatedProduct,
              -quantityToDeductValue,
              'SALE',
              'DIRECT_SALE',
              movementDescription,
              activityLogDescription,
              businessId,
              INITIATOR_TYPE.BUSINESS,
              {
                customerUnit: item.unit,
                customerQuantity: item.quantity,
                baseUnit: updatedProduct.purchaseUnit,
                baseQuantityDeducted: quantityToDeductValue,
                unitPrice: customerUnitPrice,
                totalCost: totalCost,
              },
            ),
          );
        }
      }
    }
  }

  // Helper method to get the price for a specific unit
  private getUnitPrice(product: ProductDocument, unit: string): number {
    if (product.newUnit) {
      try {
        const newUnits = JSON.parse(product.newUnit);
        const unitMapping = newUnits.find(
          (unitObj: any) => unitObj.unit === unit,
        );

        if (unitMapping && unitMapping.price) {
          return parseFloat(unitMapping.price);
        }
      } catch (error) {
        console.error('Error parsing newUnit for price:', error);
      }
    }

    // Fallback to market price if unit mapping not found
    return product.marketPrice;
  }

  async getRequestPrice(requestId: string, businessId: string) {
    const request = await this.requestModel.findById(requestId);
    const subtotal = calculateTotalPrice(this.requestProductLines(request), businessId);

    return { subtotal };
  }

  /**
   * Reject a request.
   *
   * @param rejectionDetails Reasons for rejecting the request
   * @param requestId ID of the request to reject
   * @param business Business rejecting the request
   * @returns {object} The rejected request object
   */
  async rejectRequest(
    rejectionDetails: RejectRequestDto,
    requestId: string,
    business: any,
  ): Promise<any> {
    // Find the request by ID
    const request: RequestDocument =
      await this.requestModel.findById(requestId);

    // Throw an error if the request is not found
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Ensure that only pending or new requests can be rejected
    if (request.status === RequestStatus.APPROVED) {
      throw new BadRequestException('Approved request can not be rejected');
    }

    if (request.status === RequestStatus.CANCELLED) {
      throw new BadRequestException('Cancelled request can not be rejected');
    }

    // Update the request with rejection reasons and status
    request.rejectedReasons = rejectionDetails.rejectionReasons;
    request.status = RequestStatus.REJECTED;
    request.rejectedBy = business.id;
    request.save();

    return {
      status: true,
      message: 'Request rejected successfully',
      data: request,
    };
  }

  /**
   * Cancel a request.
   *
   * @param requestId ID of the request to cancel
   * @returns {object} The cancelled request object
   */
  async cancelRequest(requestId: string, businessDetails: any): Promise<any> {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    // Find the request by ID
    const request: RequestDocument =
      await this.requestModel.findById(requestId);

    // Throw an error if the request is not found
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    await this.assertRequestBelongsToBusiness(request, businessId);

    // Update the request status to cancelled
    request.status = RequestStatus.CANCELLED;
    request.save();

    // Find and cancel the associated order if it exists
    const order: OrderDocument = await this.orderModel.findOne({
      request: request.id,
    });

    if (order) {
      order.status = ORDER_STATUS.CANCELLED;
      order.save();
    }

    return {
      status: true,
      message: 'Request cancelled successfully',
      data: request,
    };
  }

  /**
   * Get all requests based on query parameters.
   *
   * @param queryParams Query parameters for filtering requests
   * @param businessDetails Business details for filtering
   * @returns {object} List of requests matching the query
   */
  async getRequests(
    queryParams: QueryParamsDto,
    businessDetails: any,
  ): Promise<any> {
    const {
      page = 1,
      filterBy,
      filterValue,
      startDate,
      endDate,
      branchId,
    } = queryParams;

    let { limit = 10 } = queryParams;

    // Default page size; allow larger lists when filtering (customer-web request filters).
    if (!limit || limit < 1) {
      limit = 10;
    } else if (limit > 100) {
      limit = 100;
    }

    let filter: any = {};
    let branchIds: string[] = [];

    // Handle filtering by branch ID
    if (branchId) {
      const branch: BranchDocument = await this.branchModel.findById(branchId);

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      const scopedBusinessId = await this.getAuthBusinessId(businessDetails.id);

      if (branch.businessId.toString() !== scopedBusinessId) {
        throw new UnauthorizedException(
          'You cannot view requests for this branch',
        );
      }

      branchIds.push(branchId);
    } else {
      // Fetch all branches under the business if no branch ID is provided
      const business: BusinessCustomerDocument =
        await this.businessModel.findById(businessDetails.id);

      if (business) {
        // Fetch all branches under the business - optimize with projection
        const branches = await this.branchModel
          .find({ businessId: businessDetails.id }, '_id')
          .lean()
          .exec();

        if (branches.length === 0) {
          throw new NotFoundException('No branches found for this business');
        }

        branchIds = branches.map((branch) => branch._id.toString());
      } else {
        // Fetch employee and use the employee's branchId - optimize with projection
        const employee = await this.employeeModel
          .findById(businessDetails.id, 'branchId')
          .lean();

        if (!employee) {
          throw new BadRequestException(
            'You need to provide a branch ID to view requests',
          );
        }

        branchIds.push(employee.branchId.toString());
      }
    }

    // Apply branch filter
    filter.branch = { $in: branchIds };

    // Apply additional filters if provided
    if (filterBy && filterValue) {
      if (
        filterBy === 'status' &&
        typeof filterValue === 'string' &&
        filterValue.includes(',')
      ) {
        const statuses = filterValue
          .split(',')
          .map((entry) => entry.trim().toLowerCase())
          .filter(Boolean);
        if (statuses.length > 0) {
          filter.status = { $in: statuses };
        }
      } else {
        filter = { ...filter, [filterBy]: filterValue };
      }
    }

    const { amountFrom, amountTo, search } = queryParams;
    const hasAmountFilter = amountFrom !== undefined || amountTo !== undefined;
    const searchQuery = search?.trim().toLowerCase();
    const hasSearchFilter = Boolean(searchQuery);
    const needsFullScan = hasAmountFilter || hasSearchFilter;

    // Apply date range filtering if provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // totalPrice is computed in memory (not stored on Request documents) — amount filters run after that.
    let requestsQuery = this.requestModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('initiator')
      .populate('branch')
      .populate('approver')
      .populate('rejectedBy')
      .populate('couponDetails')
      .populate({
        path: 'products.product',
        model: 'Product',
      });

    if (!needsFullScan) {
      requestsQuery = requestsQuery.skip((page - 1) * limit).limit(limit);
    }

    let requests = await requestsQuery.lean().exec();

    // Calculate totals for each request
    if (requests.length > 0) {
      // Cache branch lookup - get unique branch IDs to avoid duplicate queries
      const uniqueBranchIds = [
        ...new Set(requests.map((req) => req.branch._id || req.branch)),
      ];
      const branchMap = new Map();

      // Batch fetch all unique branches
      const branches = await this.branchModel
        .find({ _id: { $in: uniqueBranchIds } }, 'businessId')
        .lean();

      branches.forEach((branch) => {
        branchMap.set(branch._id.toString(), branch);
      });

      // Cache for missing initiators
      const missingInitiatorRequestIds: string[] = [];
      const initiatorMap = new Map();

      for (const request of requests) {
        if (!request.initiator) {
          missingInitiatorRequestIds.push(request._id.toString());
        }
      }

      // Batch fetch missing initiators
      if (missingInitiatorRequestIds.length > 0) {
        const altRequests = await this.requestModel
          .find({ _id: { $in: missingInitiatorRequestIds } }, 'initiator')
          .lean();

        const initiatorIds = altRequests.map((req) => req.initiator);
        const initiators = await this.businessModel
          .find({ _id: { $in: initiatorIds } })
          .lean();

        // Map initiator data by request ID for easy lookup
        altRequests.forEach((altReq) => {
          const initiator = initiators.find(
            (init) => init._id.toString() === altReq.initiator.toString(),
          );
          if (initiator) {
            initiatorMap.set(altReq._id.toString(), initiator);
          }
        });
      }

      // Cache for JSON parsing to avoid repeated parsing of same product units
      // const jsonUnitsCache = new Map();

      for (const request of requests) {
        const productLines = this.requestProductLines(request);
        let totalPrice: number = request.serviceCharge + request.deliveryFee;
        const totalProducts: number = productLines.length;
        let totalQuantity: number = 0;

        // Get branch from cache
        // const branchId = request.branch._id || request.branch;
        // const branch = branchMap.get(branchId.toString());

        totalQuantity += productLines.reduce(
          (acc, item) => acc + item.quantity,
          0,
        );

        totalPrice += this.getRequestTotalPrice(request);

        // Handle missing initiator from cache
        if (!request.initiator && initiatorMap.has(request._id.toString())) {
          request.initiator = initiatorMap.get(request._id.toString());
        }

        // Set calculated totals on the request object (for lean documents, direct assignment)
        (request as any).totalPrice = totalPrice;
        (request as any).totalProducts = totalProducts;
        (request as any).totalQuantity = totalQuantity;
      }
    }

    if (hasSearchFilter) {
      requests = requests.filter((request) => {
        const initiator = request.initiator as
          | { email?: string; firstName?: string; lastName?: string }
          | undefined;
        const terms = [
          request.reference,
          (request.branch as { branchName?: string } | undefined)?.branchName,
          initiator?.email,
          initiator?.firstName ?? '',
          initiator?.lastName ?? '',
          ...(request.products ?? []).map(
            (item: { product?: { name?: string }; productName?: string }) =>
              item.product?.name ?? item.productName ?? '',
          ),
        ];
        return terms
          .join(' ')
          .toLowerCase()
          .includes(searchQuery!);
      });
    }

    if (hasAmountFilter) {
      requests = requests.filter((request) => {
        const totalPrice = Number((request as { totalPrice?: number }).totalPrice ?? 0);
        if (amountFrom !== undefined && totalPrice < amountFrom) {
          return false;
        }
        if (amountTo !== undefined && totalPrice > amountTo) {
          return false;
        }
        return true;
      });
    }

    const safePage = Math.max(1, page);

    if (needsFullScan) {
      const total = requests.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const offset = (safePage - 1) * limit;

      return {
        status: true,
        message: 'Requests fetched successfully',
        data: requests.slice(offset, offset + limit),
        meta: {
          page: safePage,
          limit,
          total,
          totalPages,
          hasNextPage: safePage < totalPages,
          hasPrevPage: safePage > 1,
        },
      };
    }

    const total = await this.requestModel.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      status: true,
      message: 'Requests fetched successfully',
      data: requests,
      meta: {
        page: safePage,
        limit,
        total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  /**
   * Get a single request by ID.
   *
   * @param requestId ID of the request to fetch
   * @param business Business associated with the request
   * @returns {object} The requested request object
   */
  async getSingleRequest(requestId: string, business: any): Promise<any> {
    // Find the request by ID with populated fields
    if (
      !requestId ||
      requestId === '' ||
      requestId === null ||
      requestId === undefined
    ) {
      throw new BadRequestException('Request ID is required');
    }

    const request: RequestDocument = await this.requestModel
      .findById(requestId)
      .populate('initiator')
      .populate('branch')
      .populate('approver')
      .populate('couponDetails')
      .populate('rejectedBy')
      .populate({
        path: 'products.product',
        model: 'Product',
      });

    // Throw an error if the request is not found
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const businessId = await this.getAuthBusinessId(business.id);
    await this.assertRequestBelongsToBusiness(request, businessId);
    await this.ensureRequestProductLineIds(request);

    // Ensure the business can view the request
    if (!request.initiator) {
      const altRequest: RequestDocument =
        await this.requestModel.findById(requestId);
      request.initiator = await this.businessModel.findById(
        altRequest.initiator,
      );

      if (altRequest.initiator._id.toString() !== businessId) {
        throw new UnauthorizedException(
          'You can not view this request as you are not the initiator',
        );
      }
    }

    const branchBusinessId =
      request.branch?.businessId?.toString?.() ??
      request.branch?.businessId ??
      businessId;
    const { subtotal, totalPrice } = this.resolveRequestMoneyTotals(
      request,
      String(branchBusinessId),
    );

    return {
      status: true,
      message: 'Request fetched successfully',
      data: { ...request.toObject(), subtotal, totalPrice },
    };
  }

  /**
   * Get the total price of a request.
   * @param request The request to get the total price of
   * @returns The total price of the request
   */
  private getRequestTotalPrice(request: any) {
    const productLines = this.requestProductLines(request);
    const businessId = request.branch?.businessId;

    if (request.status === RequestStatus.PENDING) {
      return calculateTotalPrice(productLines, businessId);
    }

    const requestProducts = Array.isArray(request.requestProducts)
      ? request.requestProducts
      : [];

    // use requestProducts
    const products = productLines.map((item) => {
      return {
        ...item,
        product: requestProducts.find(
          (reqItem) => reqItem._id.toString() === item.product._id.toString(),
        ),
      };
    });

    return calculateTotalPrice(products, businessId);
  }

  /**
   * Subtotal = sum of product line prices only.
   * Total = subtotal + delivery + service charge − discount.
   */
  private resolveBillableDiscount(request: any): number {
    const couponType = request.couponDetails?.type;
    if (
      couponType === CouponType.FREE_DELIVERY ||
      couponType === 'free_delivery'
    ) {
      return 0;
    }

    return Number(request.discount ?? 0);
  }

  private resolveRequestMoneyTotals(request: any, businessId: string) {
    const productLines = this.requestProductLines(request);
    const productsSubtotal =
      request.status === RequestStatus.PENDING
        ? calculateTotalPrice(productLines, businessId)
        : this.getRequestTotalPrice(request);

    const deliveryFee = Number(request.deliveryFee ?? 0);
    const serviceCharge = Number(request.serviceCharge ?? 0);
    const discount = this.resolveBillableDiscount(request);
    const totalPrice = productsSubtotal + deliveryFee + serviceCharge - discount;

    return {
      subtotal: productsSubtotal,
      totalPrice,
    };
  }

  /**
   * Update the quantity of a product in a request.
   *
   * @param data Data containing the request ID, product ID, and new quantity
   * @returns {object} The updated request with the new product quantity
   */
  async updateProductQuantity(
    data: updateQuantityDto,
    businessDetails: any,
  ): Promise<any> {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    const { requestId, cartId, quantity } = data;
    // Find the request by ID with populated products
    const request: RequestDocument = await this.requestModel
      .findById(requestId)
      .populate({
        path: 'products.product',
        model: 'Product',
      });

    // Throw an error if the request is not found
    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found`);
    }

    await this.assertRequestBelongsToBusiness(request, businessId);
    await this.ensureRequestProductLineIds(request);

    // Ensure the request is not approved or cancelled
    if (
      request.status === RequestStatus.APPROVED ||
      request.status === RequestStatus.CANCELLED
    ) {
      throw new NotFoundException('You cannot update this request');
    }

    // Find the product within the request and update the quantity
    const productIndex = request.products.findIndex(
      (p) => (p as any)?._id.toString() === cartId,
    );

    if (productIndex === -1) {
      throw new NotFoundException(
        `Product with ID ${cartId} not found in the request`,
      );
    }
    // Update the quantity
    request.products[productIndex].quantity = quantity;

    // If quantity became zero, remove the product
    if (request.products[productIndex].quantity === 0) {
      request.products.splice(productIndex, 1);
    }

    request.markModified('products');
    let update = await request.save();

    // Re-populate the products after saving
    update = await update.populate([
      {
        path: 'products.product',
        model: 'Product',
      },
      {
        path: 'initiator',
      },
    ]);

    const { subtotal, totalPrice } = this.resolveRequestMoneyTotals(
      update,
      businessId,
    );

    return {
      status: true,
      message: 'Quantity updated successfully',
      data: { ...update.toObject(), subtotal, totalPrice },
    };
  }

  /**
   * Remove a product from a request.
   *
   * @param requestId ID of the request
   * @param productId ID of the product to remove
   * @returns {object} The updated request with the product removed
   */
  async removeProductFromRequest(
    requestId: string,
    cartId: string,
    businessDetails: any,
  ): Promise<any> {
    const businessId = await this.getAuthBusinessId(businessDetails.id);
    // Find the request by ID with populated products
    const request: RequestDocument = await this.requestModel
      .findById(requestId)
      .populate({
        path: 'products.product',
        model: 'Product',
      });

    // Throw an error if the request is not found
    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found`);
    }

    await this.assertRequestBelongsToBusiness(request, businessId);
    await this.ensureRequestProductLineIds(request);

    // Prevent removal of the only product in the request
    if (request.products.length === 1) {
      throw new BadRequestException(
        'Cannot remove the only product in the request',
      );
    }

    // Find the product index and remove it from the request
    const productIndex = request.products.findIndex(
      (p) => (p as any)?._id.toString() === cartId,
    );
    if (productIndex === -1) {
      throw new NotFoundException(
        `Product with ID ${cartId} not found in the request`,
      );
    }

    request.products.splice(productIndex, 1);
    request.markModified('products');
    await request.save();

    await request.populate('initiator');

    const { subtotal, totalPrice } = this.resolveRequestMoneyTotals(
      request,
      businessId,
    );

    return {
      status: true,
      message: 'Product removed successfully',
      data: { ...request.toObject(), subtotal, totalPrice },
    };
  }

  /**
   * Add a product to an existing request.
   *
   * @param requestId ID of the request
   * @param productId ID of the product to add
   * @param quantity Quantity of the product to add (optional, defaults to 1)
   * @param notes Additional notes for the product (optional)
   * @returns {object} The updated request with the product added
   */
  async addProductToRequest(
    data: addProductDto,
    businessDetails: any,
    requestId: string,
  ): Promise<any> {
    const scopedBusinessId = await this.getAuthBusinessId(businessDetails.id);
    const { productId, quantity = 1, unit } = data;
    // Find the request by ID with populated products
    const request: RequestDocument = await this.requestModel
      .findById(requestId)
      .populate({
        path: 'products.product',
        model: 'Product',
      });

    // Throw an error if the request is not found
    if (!request) {
      throw new NotFoundException(`Request with ID ${requestId} not found`);
    }

    await this.assertRequestBelongsToBusiness(request, scopedBusinessId);

    // Find the product by ID to ensure it exists
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Find the employee and business in parallel
    const [employee, business] = await Promise.all([
      this.employeeModel.findById(businessDetails.id).populate('businessId'),
      this.businessModel.findById(businessDetails.id),
    ]);

    let initiator: string;

    // Determine the initiator type (employee or business)
    if (employee) {
      initiator = 'employee';
    } else {
      initiator = 'business';
    }

    // Check if the product already exists in the request
    const existingProductIndex = request.products.findIndex(
      (p) => p.product._id.toString() === productId && p.unit === unit,
    );

    if (existingProductIndex !== -1) {
      // If the product exists, update the quantity
      request.products[existingProductIndex].quantity += quantity;
    } else {
      // If the product doesn't exist, add it to the request
      const newProduct = {
        _id: randomUUID(),
        product,
        quantity,
        cartProduct: product,
        business: initiator === 'employee' ? employee.businessId : business.id,
        unit,
        branch: request.branch,
        totalPrice: 0,
      };

      request.products.push(newProduct as any);

      // Also update requestProducts array if it exists
      if (request.requestProducts) {
        request.requestProducts.push(product);
        request.markModified('requestProducts');
      }
    }

    request.markModified('products');

    // Recalculate the total price before saving
    const total = calculateTotalPrice(
      request.products,
      initiator === 'employee' ? employee.businessId : business.id,
    );

    // Check minimum order amount
    // if (total < 25000) {
    //   throw new BadRequestException('Minimum order is N25,000');
    // }

    // Recalculate delivery fee if frozen items are present
    const frozenFee = calculateFrozenDeliveryFee(request.products, total);

    const deliveryFeeConfig = await this.systemConfigService.getConfigByKey(
      'delivery_fee_config',
    );

    request.deliveryFee =
      frozenFee > 0
        ? frozenFee
        : calculateDeliveryFee(total, deliveryFeeConfig?.value);

    await request.save();

    const pricingBusinessId =
      initiator === 'employee' ? employee.businessId : business.id;
    const { subtotal, totalPrice } = this.resolveRequestMoneyTotals(
      request,
      String(pricingBusinessId),
    );

    return {
      status: true,
      message: 'Product added successfully',
      data: { ...request.toObject(), subtotal, totalPrice },
    };
  }
}
