import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order, OrderDocument } from '../../order/entities/order.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { QueryParamsDto } from '../../analytics/dto/query-param.dto';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../../business/schema/business.schema';
import { Timeline } from '../../order/entities/timeline.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatusChangedEvent } from './events/order-status-changed.event';
import { adminInitiator } from '../../utils/activity-initiator.util';
import { ACTIVITY_LOG_ACTION_TYPE } from '../../activity/interface/activityLog.interface';
import { ProductStockUpdatedEvent } from '../product/events/product-stock-updated.event';
import {
  AddNewProductsDto,
  CancelOrder,
  UpdateOrderProductsDto,
  UpdateOrderFeesDto,
  MarkDeliveredProductsDto,
} from './dto/update-order.dto';
import { successResponse } from '../../utils/responses';
import {
  ORDER_PAYMENT_STATUS,
  ORDER_STATUS,
} from '../../order/interface/order.interface';
import { OrderFilterParams, OrderFilterUtil } from '../../utils/filter';
import {
  Product,
  ProductDocument,
} from '../../product/entities/product.entity';
import { calculateTotalPrice, getDateFilter } from '../../utils/helpers';
import { getDashboardTimezone } from '../../utils/dashboard-timezone';
import { parseISO } from 'date-fns';
import { DateFilterDto } from '../product/dto/create-product.dto';
import { DateFilterType } from '../product/enum/product.enum';
import {
  DASHBOARD_PIE_STATUSES,
  getTrendDateBucketFormat,
  mapOrderStatusToPieBucket,
} from './order-dashboard.helpers';
import { OrderActivityLog } from '../../order/entities/activity.entity';
import {
  IActivityLog,
  INITIATOR_TYPE,
} from '../../activity/interface/activityLog.interface';
import { ActivityLog } from '../../activity/schema/activityLog.schema';
import { InventoryMovement } from '../../product/entities/inventoryMovement.entity';
import { RequestService } from '../../request/request.service';
import { randomUUID } from 'crypto';
import { createMoney } from '../../utils/money';
import { buildOrderInvoiceViewModel } from '../../utils/order-invoice-view';
import { PdfUtil } from '../../utils/pdfWriter';
import { Employee } from '../../employee/entities/employee.entity';
import { Request } from '../../request/schema/request.schema';
import {
  resolvePurchaseUnitConversion,
  snapshotOrderFinancialLines,
  summarizeOrderFinancials,
} from '../../order/order-financials';

interface CartItem {
  product: string;
  unit: string;
  quantity: number;
}

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    private eventEmitter: EventEmitter2,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    @InjectModel(Timeline.name)
    private timelineModel: Model<Timeline>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(OrderActivityLog.name)
    private orderActivityLogModel: Model<OrderActivityLog>,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
    @InjectModel(InventoryMovement.name)
    private inventoryMovementModel: Model<InventoryMovement>,
    @InjectModel(Employee.name)
    private employeeModel: Model<Employee>,
    @InjectModel(Request.name)
    private requestModel: Model<Request>,
    private requestService: RequestService,
  ) {}

  private resolveDocumentId(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null && '_id' in value) {
      return String((value as { _id?: unknown })._id ?? '');
    }

    return null;
  }

  /** Ensures request.initiator includes employee position, role, and email for admin detail views. */
  private async enrichRequestInitiator(request: Record<string, unknown>) {
    const rawInitiator = request.initiator;
    const requestId = this.resolveDocumentId(request._id ?? request.id);
    let initiatorId = this.resolveDocumentId(rawInitiator);

    if (!initiatorId && requestId) {
      const requestDoc = await this.requestModel
        .findById(requestId)
        .select('initiator')
        .lean()
        .exec();
      initiatorId = this.resolveDocumentId(requestDoc?.initiator);
    }

    if (!initiatorId) {
      return;
    }

    const employee = await this.employeeModel.findById(initiatorId).lean().exec();
    if (employee) {
      request.initiator = employee;
      return;
    }

    const business = await this.businessModel.findById(initiatorId).lean().exec();
    if (business) {
      request.initiator = {
        ...business,
        firstName: business.businessName,
        lastName: '',
        role: 'super_admin',
      };
    }
  }

  /**
   * Get orders.
   *
   * @param queryParams
   * @returns
   */
  async getOrders(queryParams: QueryParamsDto): Promise<any> {
    const {
      limit = 10,
      page = 1,
      filterBy,
      filterValue,
      startDate,
      endDate,
    } = queryParams;

    let filter: any = {};
    if (filterBy && filterValue) {
      filter = { [filterBy]: filterValue };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const totalDocuments = await this.orderModel.countDocuments(filter).exec();

    const orders: OrderDocument[] = await this.orderModel
      .find(filter)
      .populate({
        path: 'products',
        populate: {
          path: 'product',
          model: 'Product',
        },
      })
      .populate('business')
      .populate('branch')
      .populate({
        path: 'request',
        populate: {
          path: 'initiator',
          model: 'Employee',
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      status: true,
      message: 'Orders fetched successfully',
      data: {
        orders,
        totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
      },
    };
  }

  /**
   * Get filtered orders with pagination
   */
  async getFilteredOrders(query: OrderFilterParams) {
    const {
      amountFrom,
      amountTo,
      business,
      paymentMethod,
      status,
      startDate,
      endDate,
      paymentStatus,
      customerId,
      reference,
      page = 1,
      limit = 10,
    } = query;

    const filters: OrderFilterParams = {
      amountFrom,
      amountTo,
      customerId,
      business,
      paymentMethod,
      paymentStatus,
      status,
      reference,
      startDate,
      endDate,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key],
    );

    // Validate filters
    const validation = OrderFilterUtil.validateFilters(filters);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid filters: ${validation.errors.join(', ')}`,
      );
    }

    // Build the query filter
    const filterQuery = OrderFilterUtil.buildFilterQuery(filters);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with population
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filterQuery)
        .populate({
          path: 'products',
          populate: {
            path: 'product',
            model: 'Product',
          },
        })
        .populate('business')
        .populate('branch')
        .populate({
          path: 'request',
          populate: {
            path: 'initiator',
            model: 'Employee',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      status: true,
      message: 'Orders fetched successfully',
      data: {
        orders,
        meta: {
          totalDocuments: total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };
  }

  /**
   * Get a single order.
   *
   * @param orderId
   * @returns
   */
  async getSingleOrder(orderId: string): Promise<any> {
    const order: OrderDocument = await this.orderModel
      .findById(orderId)
      .populate({
        path: 'products',
        populate: {
          path: 'product',
          model: 'Product',
        },
      })
      .populate('business')
      .populate('branch')
      .populate({
        path: 'request',
        populate: {
          path: 'initiator',
        },
      });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const timeline: Timeline[] = await this.timelineModel.find({
      order: orderId,
    });

    const orderData = order.toObject() as unknown as Record<string, unknown>;
    if (orderData.request && typeof orderData.request === 'object') {
      await this.enrichRequestInitiator(orderData.request as Record<string, unknown>);
    }

    const orderWithTimeline = {
      ...orderData,
      timeline,
    };

    return {
      status: true,
      message: 'Orders fetched successfully',
      data: orderWithTimeline,
    };
  }

  async downloadOrderInvoice(orderId: string): Promise<Buffer> {
    const response = await this.getSingleOrder(orderId);
    const order = response?.data;

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const invoiceView = buildOrderInvoiceViewModel(order);
    return PdfUtil.generatePdf(invoiceView, 'order_invoice');
  }

  /**
   * Update order status.
   *
   * @param orderId
   * @param statusDetails
   * @returns
   */
  async updateOrderStatus(
    orderId: string,
    statusDetails: any,
    admin: any,
  ): Promise<any> {
    const order: OrderDocument = await this.orderModel
      .findById(orderId)
      .populate({
        path: 'products.product',
        model: 'Product',
      })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === ORDER_STATUS.DELIVERED) {
      throw new BadRequestException('Order is already delivered');
    }

    const status = statusDetails.status;
    let message = '';
    let subject = '';

    switch (status) {
      case 'shipped':
        message = 'shipped';
        subject = 'Your order is being shipped';
        break;
      case 'delivered':
        message = 'delivered';
        subject = 'Your order has been delivered';
        break;
      case 'cancelled':
        message = 'cancelled';
        subject = 'Your order has been cancelled';
        break;
      case 'accepted':
        message = 'accepted';
        subject = 'Your order has been accepted';
        break;
      case 'ready':
        message = 'ready';
        subject = 'Your order is ready for pickup';
        break;
      case 'processing':
        message = 'processing';
        subject = 'Your order is being processed';
        break;
    }

    // Add back product quantities to stock when cancelling order via status update
    if (status === ORDER_STATUS.CANCELLED) {
      if (order.products && order.products.length > 0) {
        this.addProductQuantity(order.products);
      }

      // Also add back additional products if they exist
      if (order.additionalProducts && order.additionalProducts.length > 0) {
        this.addProductQuantity(order.additionalProducts);
      }
    }

    if (status === ORDER_STATUS.DELIVERED) {
      if (order?.additionalProducts?.length >= 1) {
        throw new BadRequestException(
          'Additional products must be processed or removed before delivering the order',
        );
      }

      if (order.paymentStatus !== ORDER_PAYMENT_STATUS.PAID) {
        throw new BadRequestException('Order must be paid before delivery');
      }
    }

    const updateStatus: any = {
      status: message,
    };

    // mark all products has delivered when order status is delivered
    if (status === ORDER_STATUS.DELIVERED) {
      updateStatus.products = order.products.map((product) => {
        return {
          ...product,
          status: ORDER_STATUS.DELIVERED,
        };
      });
    }

    const updateOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      updateStatus,
    );

    const customer: BusinessCustomerDocument =
      await this.businessModel.findById(order.business);

    if (updateOrder) {
      try {
        await this.activityLogModel.create({
          ...adminInitiator(admin),
          action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
          module: 'Order',
          objectId: orderId,
          description: `Order ${(order as any).reference ?? orderId} status: ${order.status} → ${message}`,
          metadata: { changes: { status: { old: order.status, new: message } } },
        });
      } catch {
        /* logging must never break the order update */
      }

      // Emit event
      this.eventEmitter.emit(
        'order.status.changed',
        new OrderStatusChangedEvent(
          updateOrder as any,
          status,
          message,
          subject,
          admin,
          customer,
        ),
      );

      return {
        status: true,
        message: 'Order status updated successfully',
        data: updateOrder,
      };
    }
  }

  /**
   * Update order status.
   *
   * @param orderId
   * @param statusDetails
   * @returns
   */
  async cancelOrder(
    orderId: string,
    details: CancelOrder,
    admin: any,
  ): Promise<any> {
    const order: OrderDocument = await this.orderModel
      .findById(orderId)
      .populate({
        path: 'products.product',
        model: 'Product',
      })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Add back product quantities to stock when cancelling order
    if (order.products && order.products.length > 0) {
      this.addProductQuantity(order.products);
    }

    // Also add back additional products if they exist
    if (order.additionalProducts && order.additionalProducts.length > 0) {
      this.addProductQuantity(order.additionalProducts);
    }

    const updateStatus = {
      cancellationReason: details.reason,
      status: ORDER_STATUS.CANCELLED,
    };

    const updateOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      updateStatus,
      { new: true },
    );

    const customer: BusinessCustomerDocument =
      await this.businessModel.findById(order.business);

    const message = 'cancelled';
    const subject = 'Your order has been cancelled';

    if (updateOrder) {
      try {
        await this.activityLogModel.create({
          ...adminInitiator(admin),
          action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
          module: 'Order',
          objectId: orderId,
          description: `Cancelled order ${(order as any).reference ?? orderId}${details?.reason ? ` — ${details.reason}` : ''}`,
          metadata: {
            changes: { status: { old: order.status, new: ORDER_STATUS.CANCELLED } },
            reason: details?.reason ?? null,
          },
        });
      } catch {
        /* logging must never break the cancellation */
      }

      // Emit event
      this.eventEmitter.emit(
        'order.status.changed',
        new OrderStatusChangedEvent(
          updateOrder as any,
          ORDER_STATUS.CANCELLED,
          message,
          subject,
          admin,
          customer,
        ),
      );

      return successResponse('Order cancelled successfully', updateOrder);
    }
  }

  /**
   * Get order timeline.
   *
   * @param orderId
   * @returns
   */
  async getTimeline(orderId: string): Promise<any> {
    const timeline: Timeline[] = await this.timelineModel
      .find({ order: orderId })
      .sort({ createdAt: -1 })
      .exec();

    return {
      status: true,
      message: 'Timeline fetched successfully',
      data: timeline,
    };
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatusDetails: any,
    admin: any,
  ): Promise<any> {
    const { status } = paymentStatusDetails;
    const order: OrderDocument = await this.orderModel
      .findById(orderId)
      .populate({
        path: 'products.product',
        model: 'Product',
      })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Prepare update object
    let updateData: any = {
      paymentStatus: status,
    };

    // If payment status is PAID, move additionalProducts to products
    if (status === ORDER_PAYMENT_STATUS.PAID) {
      // Combine existing products with additional products
      const combinedProducts = [
        ...snapshotOrderFinancialLines(
          order.products as any[],
          order.business,
          order.discount,
        ),
        ...snapshotOrderFinancialLines(
          (order.additionalProducts || []) as any[],
          order.business,
          0,
        ),
      ];
      // Deduct product quantities from inventory once paid — but ONLY on the
      // first transition to paid. Re-marking an order that is already paid (e.g.
      // the Paystack webhook confirmed it first) must not deduct again. The
      // paymentCount gate (not the payment method) decides base-vs-additional so
      // a Paystack order that was unconfirmed at approval still gets its base
      // deducted here.
      const alreadyPaid = order.paymentStatus === ORDER_PAYMENT_STATUS.PAID;
      // Attribute the sale deduction to the order's business so the activity
      // log resolves "Performed by" instead of showing Unknown.
      const initiatorBusinessId = order.business
        ? String((order.business as any)?._id ?? order.business)
        : null;
      let nextPaymentCount = order.paymentCount || 0;
      if (!alreadyPaid) {
        if ((order.paymentCount || 0) < 1) {
          // Base stock not yet deducted → deduct base + additional.
          await this.requestService.deductProductQuantity(
            combinedProducts as any,
            initiatorBusinessId,
          );
        } else {
          // Base already deducted at approval → only additional.
          await this.requestService.deductProductQuantity(
            order.additionalProducts || [],
            initiatorBusinessId,
          );
        }
        nextPaymentCount = (order.paymentCount || 0) + 1;
      }

      // Add additional total price to main total price
      const updatedTotalPrice =
        (order.totalPrice || 0) + (order.additionalTotalPrice || 0);

      // Update the order with combined products and clear additional fields
      updateData = {
        ...updateData,
        products: combinedProducts,
        totalPrice: updatedTotalPrice,
        additionalProducts: [],
        additionalTotalPrice: 0,
        paymentCount: nextPaymentCount,
        paidAt: order.paidAt ?? new Date(),
      };
    } else {
      // Keep existing additionalProducts and additionalTotalPrice if not paid
      updateData = {
        ...updateData,
        additionalProducts: order.additionalProducts,
        additionalTotalPrice: order.additionalTotalPrice,
      };
    }

    const updateOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true },
    );

    if (updateOrder) {
      await this.orderActivityLogModel.create({
        order: orderId,
        description: `Payment status updated from ${order.paymentStatus} to ${status}`,
        initiator: `${admin.firstName} ${admin.lastName}`,
      });

      try {
        await this.activityLogModel.create({
          ...adminInitiator(admin),
          action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
          module: 'Order',
          objectId: orderId,
          description: `Order ${(order as any).reference ?? orderId} payment: ${order.paymentStatus} → ${status}`,
          metadata: {
            changes: { paymentStatus: { old: order.paymentStatus, new: status } },
          },
        });
      } catch {
        /* logging must never break the payment update */
      }

      return {
        status: true,
        message: 'Payment status updated successfully',
        data: updateOrder,
      };
    }
  }

  async addProductsToOrder(
    orderDetails: AddNewProductsDto,
    admin?: any,
  ): Promise<any> {
    const { orderId, products } = orderDetails;

    // Find the order
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Build the additional products array matching your Cart entity structure
    const newAdditionalProducts = [];
    const addedItems: string[] = [];

    for (const cartItem of products as CartItem[]) {
      // Validate product exists
      const product = await this.productModel.findById(cartItem.product);

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${cartItem.product} not found`,
        );
      }

      const cartProduct = {
        _id: randomUUID(),
        product: product,
        unit: cartItem.unit,
        quantity: cartItem.quantity,
      };

      newAdditionalProducts.push(cartProduct);
      addedItems.push(
        `${(product as any).name ?? cartItem.product} (${cartItem.quantity} × ${cartItem.unit})`,
      );
    }

    // Handle adding to additionalProducts array
    if (order.additionalProducts && order.additionalProducts.length > 0) {
      // Spread existing and new products to avoid nested arrays
      order.additionalProducts = [
        ...order.additionalProducts,
        ...newAdditionalProducts,
      ];
    } else {
      // Initialize with new products
      order.additionalProducts = newAdditionalProducts;
    }

    // Calculate and add to additional total price
    const additionalTotal = calculateTotalPrice(
      newAdditionalProducts,
      order.business,
    );
    const previousTotal = order.additionalTotalPrice;
    const previousPaymentStatus = order.paymentStatus;
    order.additionalTotalPrice += additionalTotal;
    order.paymentStatus = ORDER_PAYMENT_STATUS.PARTIAL;

    // Save the order
    await order.save();

    try {
      await this.activityLogModel.create({
        ...adminInitiator(admin),
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: 'Order',
        objectId: orderId,
        description: `Added ${addedItems.length} item(s) to order: ${addedItems.join(', ')}`,
        metadata: {
          changes: {
            'added items': { old: null, new: addedItems },
            'additional total': {
              old: previousTotal,
              new: order.additionalTotalPrice,
            },
            'payment status': {
              old: previousPaymentStatus,
              new: order.paymentStatus,
            },
          },
        },
      });
    } catch {
      /* logging must never break the order update */
    }

    return {
      status: true,
      message: 'New products added successfully',
      data: order,
    };
  }

  /**
   * Update order products and calculate refund amount
   *
   * @param orderId
   * @param updateOrderProductsDto
   * @param adminUser
   * @returns
   */
  // async updateOrderProductsAndCalculateRefund(
  //   orderId: string,
  //   updateOrderProductsDto: UpdateOrderProductsDto,
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   adminUser: any,
  // ): Promise<any> {
  //   const order = await this.orderModel
  //     .findById(orderId)
  //     .populate('products.product')
  //     .populate('additionalProducts.product')
  //     .populate('business')
  //     .exec();

  //   if (!order) {
  //     throw new NotFoundException('Order not found');
  //   }

  //   // Calculate original additional products total
  //   const originalAdditionalProductsTotal =
  //     order.additionalProducts?.length > 0
  //       ? calculateTotalPrice(
  //           order.additionalProducts,
  //           (order.business as any)._id.toString(),
  //         )
  //       : 0;

  //   // Note: We don't include delivery and service charges here since we're only updating additional products
  //   const originalTotalWithFees = originalAdditionalProductsTotal;

  //   // Ensure originalTotal is valid
  //   if (isNaN(originalTotalWithFees)) {
  //     throw new BadRequestException(
  //       'Unable to calculate original additional products total',
  //     );
  //   }

  //   // Store original additional products for timeline
  //   const originalAdditionalProducts = order.additionalProducts
  //     ? [...order.additionalProducts]
  //     : [];

  //   // Update additional product quantities only
  //   const updatedAdditionalProducts: any[] = [];
  //   let refundAmount = 0;

  //   // First, calculate refund for products that will be completely removed (not mentioned in update)
  //   if (order.additionalProducts && order.additionalProducts.length > 0) {
  //     for (const existingProduct of order.additionalProducts) {
  //       const isProductInUpdate = updateOrderProductsDto.products.some(
  //         (productUpdate) =>
  //           productUpdate.productId === existingProduct.product._id.toString(),
  //       );

  //       // If product is not mentioned in the update request, it will be removed completely
  //       if (!isProductInUpdate) {
  //         // Add the full value of this product to the refund
  //         if (existingProduct.totalPrice && existingProduct.totalPrice > 0) {
  //           refundAmount += existingProduct.totalPrice;
  //         } else {
  //           // Fallback: calculate from quantity and unit price
  //           const product: any = existingProduct.product;
  //           let unitPrice = 0;

  //           if (product.version === 'v2') {
  //             try {
  //               const unitPrices = JSON.parse(product.unit);
  //               unitPrice = unitPrices[existingProduct.unit];
  //               if (isNaN(unitPrice)) {
  //                 unitPrice = product.discountPrice;
  //               }
  //             } catch (error) {
  //               console.warn(
  //                 'Error parsing unit prices for product:',
  //                 product._id,
  //               );
  //               unitPrice = product.discountPrice;
  //             }
  //           } else {
  //             // Handle v1 products with special pricing
  //             const specialPrice = product.specialPrices?.find(
  //               (item: any) =>
  //                 item.customerId === (order.business as any)._id.toString(),
  //             );
  //             unitPrice = specialPrice
  //               ? specialPrice.price
  //               : product.discountPrice;
  //           }

  //           const validUnitPrice = isNaN(unitPrice) ? 0 : Number(unitPrice);
  //           const validQuantity = isNaN(existingProduct.quantity)
  //             ? 0
  //             : Number(existingProduct.quantity);
  //           refundAmount += validUnitPrice * validQuantity;
  //         }
  //       }
  //     }
  //   }

  //   // Then, process products that are explicitly mentioned in the update
  //   for (const productUpdate of updateOrderProductsDto.products) {
  //     // Only check in additional products array
  //     const existingProductIndex =
  //       order.additionalProducts?.findIndex(
  //         (item) => item.product._id.toString() === productUpdate.productId,
  //       ) ?? -1;

  //     if (existingProductIndex === -1) {
  //       continue; // Skip if product not found in additional products
  //     }

  //     const existingProduct = order.additionalProducts[existingProductIndex];
  //     const product: any = existingProduct.product;

  //     // Calculate unit price based on product version
  //     let unitPrice = 0;

  //     if (product.version === 'v2') {
  //       try {
  //         const unitPrices = JSON.parse(product.unit);
  //         unitPrice = unitPrices[existingProduct.unit];
  //         if (isNaN(unitPrice)) {
  //           unitPrice = product.discountPrice;
  //         }
  //       } catch (error) {
  //         console.warn('Error parsing unit prices for product:', product._id);
  //         unitPrice = product.discountPrice;
  //       }
  //     } else {
  //       // Handle v1 products with special pricing
  //       const specialPrice = product.specialPrices?.find(
  //         (item: any) =>
  //           item.customerId === (order.business as any)._id.toString(),
  //       );
  //       unitPrice = specialPrice ? specialPrice.price : product.discountPrice;
  //     }

  //     // Alternative: Calculate unit price from existing product totalPrice
  //     // If totalPrice exists and is valid, use it; otherwise fall back to product pricing
  //     let calculatedUnitPrice = unitPrice;

  //     if (
  //       existingProduct.totalPrice &&
  //       existingProduct.quantity &&
  //       existingProduct.totalPrice > 0 &&
  //       existingProduct.quantity > 0
  //     ) {
  //       calculatedUnitPrice =
  //         existingProduct.totalPrice / existingProduct.quantity;
  //     }

  //     // If we still don't have a valid unit price, and product data is incomplete,
  //     // use the calculateTotalPrice helper to get the correct pricing
  //     if (calculatedUnitPrice === 0 || isNaN(calculatedUnitPrice)) {
  //       // Create a temporary cart item to calculate the unit price
  //       const tempCartItem = {
  //         ...existingProduct,
  //         quantity: 1, // Set to 1 to get unit price
  //       };

  //       // Use the helper function to calculate price for 1 unit
  //       const singleUnitTotal = calculateTotalPrice(
  //         [tempCartItem],
  //         (order.business as any)._id.toString(),
  //       );

  //       calculatedUnitPrice = singleUnitTotal;
  //     }

  //     // Ensure unitPrice is a valid number
  //     const validUnitPrice = isNaN(calculatedUnitPrice)
  //       ? 0
  //       : Number(calculatedUnitPrice);
  //     const validNewQuantity = isNaN(productUpdate.newQuantity)
  //       ? 0
  //       : Number(productUpdate.newQuantity);
  //     const validExistingQuantity = isNaN(existingProduct.quantity)
  //       ? 0
  //       : Number(existingProduct.quantity);

  //     // Calculate refund for reduced quantity (only for explicitly mentioned products)
  //     const quantityDifference = validExistingQuantity - validNewQuantity;
  //     if (quantityDifference > 0) {
  //       const refundForThisProduct = quantityDifference * validUnitPrice;
  //       refundAmount += refundForThisProduct;
  //     }

  //     // Update the additional product quantity
  //     if (validNewQuantity > 0) {
  //       updatedAdditionalProducts.push({
  //         ...existingProduct,
  //         quantity: validNewQuantity,
  //         totalPrice: validUnitPrice * validNewQuantity,
  //       });
  //     }
  //     // If newQuantity is 0, the product is removed (not added to updatedAdditionalProducts)
  //   }

  //   // Note: Products not mentioned in the update request will be removed completely
  //   // and their full value is already included in the refund calculation above

  //   // Update order with new additional products only (leave main products unchanged)
  //   order.additionalProducts = updatedAdditionalProducts;

  //   // Calculate new additional total using the helper function
  //   const newAdditionalTotal = calculateTotalPrice(
  //     order.additionalProducts,
  //     (order.business as any)._id.toString(),
  //   );

  //   // Update only the additionalTotalPrice (don't touch totalPrice)
  //   order.additionalTotalPrice = newAdditionalTotal;
  //   order.paymentStatus = ORDER_PAYMENT_STATUS.PARTIAL;
  //   await order.save();

  //   // Create order activity log
  //   await this.orderActivityLogModel.create({
  //     order: orderId,
  //     description: `Updated order products. ${
  //       updateOrderProductsDto.reason
  //         ? `Reason: ${updateOrderProductsDto.reason}`
  //         : ''
  //     }`,
  //     initiator: `${adminUser.firstName} ${adminUser.lastName}`,
  //   });

  //   // Ensure refundAmount is a valid number
  //   const validRefundAmount = isNaN(refundAmount) ? 0 : Number(refundAmount);

  //   // Prepare response with refund calculation
  //   const response = {
  //     orderId: order._id,
  //     originalAdditionalTotal: originalTotalWithFees,
  //     newAdditionalTotal: newAdditionalTotal,
  //     refundAmount: validRefundAmount,
  //     updatedAdditionalProducts: order.additionalProducts,
  //     removedAdditionalProducts: originalAdditionalProducts.filter(
  //       (originalProduct) =>
  //         !updatedAdditionalProducts.find(
  //           (updatedProduct) =>
  //             updatedProduct.product._id.toString() ===
  //             originalProduct.product._id.toString(),
  //         ),
  //     ),
  //   };

  //   return {
  //     status: true,
  //     message: 'Order products updated successfully',
  //     data: response,
  //   };
  // }

  async updateOrderProductsAndCalculateRefund(
    orderId: string,
    updateOrderProductsDto: UpdateOrderProductsDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adminUser: any,
  ): Promise<any> {
    const order = await this.orderModel
      .findById(orderId)
      .populate('products.product')
      .populate('additionalProducts.product')
      .populate('business')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate original additional products total
    const originalAdditionalProductsTotal =
      order.additionalProducts?.length > 0
        ? calculateTotalPrice(
            order.additionalProducts,
            (order.business as any)._id.toString(),
          )
        : 0;

    // Note: We don't include delivery and service charges here since we're only updating additional products
    const originalTotalWithFees = originalAdditionalProductsTotal;

    // Ensure originalTotal is valid
    if (isNaN(originalTotalWithFees)) {
      throw new BadRequestException(
        'Unable to calculate original additional products total',
      );
    }

    // Store original additional products for timeline
    const originalAdditionalProducts = order.additionalProducts
      ? [...order.additionalProducts]
      : [];

    // Update additional product quantities only
    const updatedAdditionalProducts: any[] = [];
    let refundAmount = 0;

    // First, calculate refund for products that will be completely removed (not mentioned in update)
    if (order.additionalProducts && order.additionalProducts.length > 0) {
      for (const existingProduct of order.additionalProducts) {
        const isProductInUpdate = updateOrderProductsDto.products.some(
          (productUpdate) =>
            productUpdate.cartId === (existingProduct as any)._id,
        );

        // If product is not mentioned in the update request, it will be removed completely
        if (!isProductInUpdate) {
          // Add the full value of this product to the refund
          if (existingProduct.totalPrice && existingProduct.totalPrice > 0) {
            refundAmount += existingProduct.totalPrice;
          } else {
            // Fallback: calculate from quantity and unit price
            const product: any = existingProduct.product;
            let unitPrice = 0;

            if (product.version === 'v2') {
              try {
                const unitPrices = JSON.parse(product.unit);
                unitPrice = unitPrices[existingProduct.unit];
                if (isNaN(unitPrice)) {
                  unitPrice = product.discountPrice;
                }
              } catch (error) {
                console.warn(
                  'Error parsing unit prices for product:',
                  product._id,
                );
                unitPrice = product.discountPrice;
              }
            } else {
              // Handle v1 products with special pricing
              const specialPrice = product.specialPrices?.find(
                (item: any) =>
                  item.customerId === (order.business as any)._id.toString(),
              );
              unitPrice = specialPrice
                ? specialPrice.price
                : product.discountPrice;
            }

            const validUnitPrice = isNaN(unitPrice) ? 0 : Number(unitPrice);
            const validQuantity = isNaN(existingProduct.quantity)
              ? 0
              : Number(existingProduct.quantity);
            refundAmount += validUnitPrice * validQuantity;
          }
        }
      }
    }

    // Then, process products that are explicitly mentioned in the update
    for (const productUpdate of updateOrderProductsDto.products) {
      // Only check in additional products array
      const existingProductIndex =
        order.additionalProducts?.findIndex(
          (item) => (item as any)._id === productUpdate.cartId,
        ) ?? -1;

      if (existingProductIndex === -1) {
        continue; // Skip if product not found in additional products
      }

      const existingProduct = order.additionalProducts[existingProductIndex];
      const product: any = existingProduct.product;

      // Calculate unit price based on product version - USE THE UNIT FROM THE REQUEST
      let unitPrice = 0;
      const requestedUnit = productUpdate.unit || existingProduct.unit; // Fallback to existing unit if not provided

      if (product.version === 'v2') {
        try {
          const unitPrices = JSON.parse(product.unit);
          unitPrice = unitPrices[requestedUnit]; // Use requested unit instead of existing unit
          if (isNaN(unitPrice)) {
            unitPrice = product.discountPrice;
          }
        } catch (error) {
          console.warn('Error parsing unit prices for product:', product._id);
          unitPrice = product.discountPrice;
        }
      } else {
        // Handle v1 products with special pricing
        const specialPrice = product.specialPrices?.find(
          (item: any) =>
            item.customerId === (order.business as any)._id.toString(),
        );
        unitPrice = specialPrice ? specialPrice.price : product.discountPrice;
      }

      // Calculate refund based on existing product's unit price (before unit change)
      let existingUnitPrice = 0;
      if (product.version === 'v2') {
        try {
          const unitPrices = JSON.parse(product.unit);
          existingUnitPrice = unitPrices[existingProduct.unit];
          if (isNaN(existingUnitPrice)) {
            existingUnitPrice = product.discountPrice;
          }
        } catch (error) {
          console.warn(
            'Error parsing unit prices for existing product:',
            product._id,
          );
          existingUnitPrice = product.discountPrice;
        }
      } else {
        const specialPrice = product.specialPrices?.find(
          (item: any) =>
            item.customerId === (order.business as any)._id.toString(),
        );
        existingUnitPrice = specialPrice
          ? specialPrice.price
          : product.discountPrice;
      }

      // Alternative: Calculate unit price from existing product totalPrice for refund calculation
      let calculatedExistingUnitPrice = existingUnitPrice;

      if (
        existingProduct.totalPrice &&
        existingProduct.quantity &&
        existingProduct.totalPrice > 0 &&
        existingProduct.quantity > 0
      ) {
        calculatedExistingUnitPrice =
          existingProduct.totalPrice / existingProduct.quantity;
      }

      // If we still don't have a valid unit price, use the calculateTotalPrice helper
      if (
        calculatedExistingUnitPrice === 0 ||
        isNaN(calculatedExistingUnitPrice)
      ) {
        const tempCartItem = {
          ...existingProduct,
          quantity: 1,
        };

        const singleUnitTotal = calculateTotalPrice(
          [tempCartItem],
          (order.business as any)._id.toString(),
        );

        calculatedExistingUnitPrice = singleUnitTotal;
      }

      // Ensure prices are valid numbers
      const validExistingUnitPrice = isNaN(calculatedExistingUnitPrice)
        ? 0
        : Number(calculatedExistingUnitPrice);
      const validNewUnitPrice = isNaN(unitPrice) ? 0 : Number(unitPrice);
      const validNewQuantity = isNaN(productUpdate.newQuantity)
        ? 0
        : Number(productUpdate.newQuantity);
      const validExistingQuantity = isNaN(existingProduct.quantity)
        ? 0
        : Number(existingProduct.quantity);

      // Calculate refund: refund the full existing amount, then we'll charge the new amount
      const existingTotal = validExistingUnitPrice * validExistingQuantity;
      const newTotal = validNewUnitPrice * validNewQuantity;

      // Refund the difference (if new total is less than existing total)
      if (existingTotal > newTotal) {
        refundAmount += existingTotal - newTotal;
      }

      // Update the additional product with new unit and quantity
      if (validNewQuantity > 0) {
        updatedAdditionalProducts.push({
          ...existingProduct,
          unit: requestedUnit, // Update the unit to the requested one
          quantity: validNewQuantity,
          totalPrice: validNewUnitPrice * validNewQuantity,
        });
      }
      // If newQuantity is 0, the product is removed (not added to updatedAdditionalProducts)
    }

    // Update order with new additional products only (leave main products unchanged)
    order.additionalProducts = updatedAdditionalProducts;

    // Calculate new additional total using the helper function
    const newAdditionalTotal = calculateTotalPrice(
      order.additionalProducts,
      (order.business as any)._id.toString(),
    );

    // Update only the additionalTotalPrice (don't touch totalPrice)
    order.additionalTotalPrice = newAdditionalTotal;
    order.paymentStatus = ORDER_PAYMENT_STATUS.PARTIAL;
    await order.save();

    // Create order activity log
    await this.orderActivityLogModel.create({
      order: orderId,
      description: `Updated order products. ${
        updateOrderProductsDto.reason
          ? `Reason: ${updateOrderProductsDto.reason}`
          : ''
      }`,
      initiator: `${adminUser.firstName} ${adminUser.lastName}`,
    });

    // Ensure refundAmount is a valid number
    const validRefundAmount = isNaN(refundAmount) ? 0 : Number(refundAmount);

    // Structured field-level entry in the global activity log.
    try {
      const summarize = (list: any[]) =>
        (list ?? []).map((p) => {
          const prod = p?.product;
          const name =
            prod && typeof prod === 'object'
              ? ((prod as any).name ?? (prod as any)._id ?? prod)
              : prod;
          return `${name} (${p?.quantity} × ${p?.unit})`;
        });
      await this.activityLogModel.create({
        ...adminInitiator(adminUser),
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: 'Order',
        objectId: orderId,
        description: `Edited order items${validRefundAmount ? ` (refund ₦${validRefundAmount})` : ''}`,
        metadata: {
          changes: {
            items: {
              old: summarize(originalAdditionalProducts),
              new: summarize(order.additionalProducts),
            },
            'additional total': {
              old: originalTotalWithFees,
              new: newAdditionalTotal,
            },
          },
          refundAmount: validRefundAmount,
          reason: updateOrderProductsDto.reason ?? null,
        },
      });
    } catch {
      /* logging must never break the order update */
    }

    // Prepare response with refund calculation
    const response = {
      orderId: order._id,
      originalAdditionalTotal: originalTotalWithFees,
      newAdditionalTotal: newAdditionalTotal,
      refundAmount: validRefundAmount,
      updatedAdditionalProducts: order.additionalProducts,
      removedAdditionalProducts: originalAdditionalProducts.filter(
        (originalProduct) =>
          !updatedAdditionalProducts.find(
            (updatedProduct) =>
              updatedProduct?._id === (originalProduct as any)?._id,
          ),
      ),
    };

    return {
      status: true,
      message: 'Order products updated successfully',
      data: response,
    };
  }

  /**
   * Update order fees and discount
   *
   * @param orderId
   * @param updateOrderFeesDto
   * @param adminUser
   * @returns
   */
  async updateOrderFees(
    orderId: string,
    updateOrderFeesDto: UpdateOrderFeesDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adminUser: any,
  ): Promise<any> {
    const order = await this.orderModel
      .findById(orderId)
      .populate('products.product')
      .populate('business')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const {
      deliveryFee,
      serviceCharge,
      discountAmount,
      discountPercentage,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reason,
    } = updateOrderFeesDto;

    // Validate that only one discount type is provided
    if (discountAmount && discountPercentage) {
      throw new BadRequestException(
        'Please provide either discount amount or discount percentage, not both',
      );
    }

    // Store original values for timeline
    const originalDeliveryFee = order.deliveryFee;
    const originalServiceCharge = order.serviceCharge;
    const originalDiscount = order.discount;
    const originalTotal = order.totalPrice;

    // Update delivery fee if provided
    if (deliveryFee !== undefined) {
      order.deliveryFee = Number(deliveryFee);
    }

    // Update service charge if provided
    if (serviceCharge !== undefined) {
      order.serviceCharge = Number(serviceCharge);
    }

    // Calculate base total from products (without fees and discount)
    const baseTotal = calculateTotalPrice(
      order.products,
      (order.business as any)._id.toString(),
    );

    // Calculate discount
    let calculatedDiscount = 0;
    if (discountPercentage !== undefined) {
      calculatedDiscount = (baseTotal * Number(discountPercentage)) / 100;
    } else if (discountAmount !== undefined) {
      calculatedDiscount = Number(discountAmount);
    } else if (originalDiscount > 0) {
      // Keep existing discount if no new discount is provided
      calculatedDiscount = originalDiscount;
    }

    // Ensure discount doesn't exceed base total
    if (calculatedDiscount > baseTotal) {
      throw new BadRequestException(
        'Discount amount cannot exceed the order subtotal',
      );
    }

    order.discount = calculatedDiscount;

    // Calculate new total: baseTotal + deliveryFee + serviceCharge - discount
    const newTotal =
      baseTotal + order.deliveryFee + order.serviceCharge - order.discount;

    // Ensure total is not negative
    if (newTotal < 0) {
      throw new BadRequestException(
        'Total amount cannot be negative after applying discount',
      );
    }

    order.totalPrice = newTotal;
    order.paymentStatus = ORDER_PAYMENT_STATUS.PARTIAL;
    await order.save();

    // Create activity log entry
    const changes = [];
    if (deliveryFee !== undefined && deliveryFee !== originalDeliveryFee) {
      changes.push(`Delivery fee: ₦${originalDeliveryFee} → ₦${deliveryFee}`);
    }
    if (
      serviceCharge !== undefined &&
      serviceCharge !== originalServiceCharge
    ) {
      changes.push(
        `Service charge: ₦${originalServiceCharge} → ₦${serviceCharge}`,
      );
    }
    if (calculatedDiscount !== originalDiscount) {
      changes.push(`Discount: ₦${originalDiscount} → ₦${calculatedDiscount}`);
    }

    const timelineDescription = `Admin ${adminUser.email} updated order fees. ${changes.join(', ')}${
      reason ? `. Reason: ${reason}` : ''
    }`;

    await this.orderActivityLogModel.create({
      order: orderId,
      description: timelineDescription,
      initiator: `${adminUser.firstName} ${adminUser.lastName}`,
    });

    // Also record a structured field-level entry in the global activity log.
    try {
      const feeChanges: Record<string, { old: unknown; new: unknown }> = {};
      if (order.deliveryFee !== originalDeliveryFee) {
        feeChanges['delivery fee'] = {
          old: originalDeliveryFee,
          new: order.deliveryFee,
        };
      }
      if (order.serviceCharge !== originalServiceCharge) {
        feeChanges['service charge'] = {
          old: originalServiceCharge,
          new: order.serviceCharge,
        };
      }
      if (order.discount !== originalDiscount) {
        feeChanges['discount'] = { old: originalDiscount, new: order.discount };
      }
      await this.activityLogModel.create({
        ...adminInitiator(adminUser),
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: 'Order',
        objectId: orderId,
        description: `Updated order fees${changes.length ? ` — ${changes.join(', ')}` : ''}`,
        metadata: { changes: feeChanges, reason: reason ?? null },
      });
    } catch {
      /* logging must never break the fee update */
    }

    // Prepare response
    const response = {
      orderId: order._id,
      originalTotal,
      newTotal,
      changes: {
        deliveryFee: {
          old: originalDeliveryFee,
          new: order.deliveryFee,
        },
        serviceCharge: {
          old: originalServiceCharge,
          new: order.serviceCharge,
        },
        discount: {
          old: originalDiscount,
          new: order.discount,
        },
      },
      baseTotal,
      discountType: discountPercentage
        ? `${discountPercentage}%`
        : discountAmount
          ? 'Fixed amount'
          : 'No change',
    };

    return {
      status: true,
      message: 'Order fees updated successfully',
      data: response,
    };
  }

  // Fetch order activity logs
  async fetchOrderActivityLogs(
    orderId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const {
      limit = 5,
      page = 1,
      filterBy,
      filterValue,
      startDate,
      endDate,
    } = queryParams;

    let filter: any = {};
    if (filterBy && filterValue) {
      filter = { [filterBy]: filterValue };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const totalDocuments = await this.orderActivityLogModel
      .countDocuments(filter)
      .exec();

    const activityLogs = await this.orderActivityLogModel
      .find({ order: orderId, ...filter })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      status: true,
      message: 'Order activity logs fetched successfully',
      data: {
        logs: activityLogs,
        meta: {
          totalDocuments,
          page,
          limit,
          totalPages: Math.ceil(totalDocuments / limit),
        },
      },
    };
  }

  /**
   * Deduct product quantity from stock
   *
   * @param products
   */
  async deductProductQuantity(
    products: { product: ProductDocument; quantity: number }[],
  ): Promise<void> {
    for (const item of products) {
      const product = item.product;

      if (product.trackQuantity) {
        const totalDeductionCost = product.marketPrice * item.quantity;

        // Perform atomic deduction and get updated document
        const updatedProduct = await this.productModel.findByIdAndUpdate(
          product._id,
          {
            $inc: {
              quantity: -item.quantity,
              totalPrice: -totalDeductionCost,
            },
          },
          { new: true },
        );

        if (updatedProduct) {
          const activityLogDescription = `Quantity ${item.quantity} ${product.purchaseUnit} worth ${createMoney(totalDeductionCost, 'naira').format()} of the market price deducted from sales. Remaining ${updatedProduct.quantity} quantity.`;

          this.eventEmitter.emit(
            'product.stock.updated',
            new ProductStockUpdatedEvent(
              updatedProduct,
              -item.quantity,
              'DEDUCTION',
              'SALE',
              `Sale deduction: ${item.quantity} ${product.purchaseUnit} deducted.`,
              activityLogDescription,
            ),
          );
        }
      }
    }
  }

  /**
   * Add product quantity back to stock (for cancelled orders)
   *
   * @param products
   */
  async addProductQuantity(
    products: { product: ProductDocument; quantity: number; unit: string }[],
  ): Promise<void> {
    for (const item of products) {
      const product = item.product;

      if (product.trackQuantity) {
        // Find the conversion factor from newUnit array
        let quantityToAdd = item.quantity;

        const purchaseUnitConversion = resolvePurchaseUnitConversion(
          product as any,
          item.unit,
        );
        if (purchaseUnitConversion !== null) {
          quantityToAdd = item.quantity * purchaseUnitConversion;
        }

        const quantityToAddValue = quantityToAdd;
        const totalAdditionCost = product.marketPrice * quantityToAddValue;

        // Perform atomic addition and get updated document
        const updatedProduct = await this.productModel.findByIdAndUpdate(
          product._id,
          {
            $inc: {
              quantity: quantityToAddValue,
              totalPrice: totalAdditionCost,
            },
          },
          { new: true },
        );

        if (updatedProduct) {
          // Calculate the cost based on the customer's purchase unit and quantity
          const customerUnitPrice = this.getUnitPrice(product, item.unit);
          const totalCost = item.quantity * customerUnitPrice;

          const movementDescription = `Return addition: ${item.quantity} ${item.unit} (equivalent to ${quantityToAddValue} ${product.purchaseUnit}) worth ${createMoney(totalCost, 'naira').format()}. Remaining ${updatedProduct.quantity} quantity.`;
          const activityLogDescription = `Quantity ${item.quantity} ${item.unit} (equivalent to ${quantityToAddValue} ${product.purchaseUnit}) worth ${createMoney(totalCost, 'naira').format()} added back to stock due to order cancellation. Remaining ${updatedProduct.quantity} quantity.`;

          this.eventEmitter.emit(
            'product.stock.updated',
            new ProductStockUpdatedEvent(
              updatedProduct,
              quantityToAddValue,
              'ADDITION',
              'ORDER_CANCELLATION',
              movementDescription,
              activityLogDescription,
              null,
              INITIATOR_TYPE.ADMIN,
              {
                customerUnit: item.unit,
                customerQuantity: item.quantity,
                baseUnit: product.purchaseUnit,
                baseQuantityAdded: quantityToAddValue,
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

  async markDeliveredProducts(
    orderId: string,
    body: MarkDeliveredProductsDto,
    admin: any,
  ) {
    const { cartIds } = body;

    if (cartIds.length === 0) {
      throw new BadRequestException('No products selected');
    }

    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const allowedPaymentStatuses = [
      ORDER_PAYMENT_STATUS.PARTIAL,
      ORDER_PAYMENT_STATUS.PAID,
    ];

    if (!allowedPaymentStatuses.includes(order.paymentStatus)) {
      throw new BadRequestException(
        `Order payment status must be either ${ORDER_PAYMENT_STATUS.PARTIAL} or ${ORDER_PAYMENT_STATUS.PAID}`,
      );
    }

    if (order.status === ORDER_STATUS.DELIVERED) {
      throw new BadRequestException('Order already delivered');
    }

    let updatesMade = false;
    let subject = '';
    const previousOrderStatus = order.status;
    const cartIdSet = new Set(cartIds.map((id) => id.toString()));
    const now = new Date();
    let deliveredCount = 0;

    for (const product of order.products) {
      const productId = (product as any)?._id.toString();

      if (!productId) continue;

      if (product.status === ORDER_STATUS.DELIVERED) {
        deliveredCount++;
        continue;
      }

      if (cartIdSet.has(productId)) {
        product.status = ORDER_STATUS.DELIVERED;
        product.deliveredAt = now;
        updatesMade = true;
        deliveredCount++;

        cartIdSet.delete(productId);
      }
    }

    if (updatesMade) {
      order.markModified('products');

      const allProducts = [
        ...order.products,
        ...(order.additionalProducts || []),
      ];

      const allDelivered = allProducts.every(
        (p: any) => p?.status === ORDER_STATUS.DELIVERED,
      );
      // Check if ANY is delivered (for partial)
      const anyDelivered = allProducts.some(
        (p: any) => p?.status === ORDER_STATUS.DELIVERED,
      );

      if (allDelivered) {
        order.status = ORDER_STATUS.DELIVERED;
        order.deliveredAt = now;
        subject = 'Your order has been delivered';
      } else if (anyDelivered) {
        order.status = ORDER_STATUS.PARTIALLY_DELIVERED;
        subject = `${deliveredCount} of ${order.products.length} products have been delivered`;
      }

      if (allDelivered && order.paymentStatus !== ORDER_PAYMENT_STATUS.PAID) {
        throw new BadRequestException(
          'Order must be fully paid before delivery',
        );
      }

      await order.save();

      try {
        await this.activityLogModel.create({
          ...adminInitiator(admin),
          action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
          module: 'Order',
          objectId: orderId,
          description: `Marked ${cartIds.length} item(s) delivered`,
          metadata: {
            changes: {
              status: { old: previousOrderStatus, new: order.status },
            },
            deliveredItemIds: cartIds,
          },
        });
      } catch {
        /* logging must never break the delivery update */
      }

      const customer: BusinessCustomerDocument =
        await this.businessModel.findById(order.business);

      this.eventEmitter.emit(
        'order.status.changed',
        new OrderStatusChangedEvent(
          order as any,
          order.status,
          ORDER_STATUS.DELIVERED,
          subject,
          admin,
          customer,
        ),
      );
    }

    return successResponse('Products status updated successfully', order);
  }

  async getDashboardMetrics(query: DateFilterDto) {
    const { startDate, endDate, filterType } = query;
    const customDateRange =
      startDate && endDate
        ? { start: parseISO(startDate), end: parseISO(endDate) }
        : undefined;

    const dateFilter = getDateFilter(filterType, customDateRange);
    const bucketFormat = getTrendDateBucketFormat(filterType);
    const dashboardTimezone = getDashboardTimezone();

    // Revenue/profit are attributed by the order's CREATION date (matching the
    // Orders list and the trends chart), not the payment date. So an order
    // created earlier but paid today counts toward its creation day, never
    // today. Still paid-only (unpaid/partial excluded) via the cursor's
    // paymentStatus filter below.
    const createdAtRange = (dateFilter as any).createdAt;
    const financialDateFilter = createdAtRange
      ? { createdAt: createdAtRange }
      : {};

    const [trendRows, statusRows] = await Promise.all([
      this.orderModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: bucketFormat,
                date: '$createdAt',
                timezone: dashboardTimezone,
              },
            },
            orderCount: { $sum: 1 },
            totalValue: { $sum: { $ifNull: ['$totalPrice', 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.orderModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $toLower: {
                $ifNull: ['$status', 'unknown'],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const financialSummary = {
      revenue: 0,
      verifiedRevenue: 0,
      costOfGoodsSold: 0,
      grossProfit: 0,
      qualifyingOrderCount: 0,
      verifiedProfitOrderCount: 0,
      unverifiedProfitOrderCount: 0,
    };
    const financialOrderCursor = this.orderModel
      .find({
        ...financialDateFilter,
        paymentStatus: ORDER_PAYMENT_STATUS.PAID,
        status: {
          $nin: [
            ORDER_STATUS.CANCELLED,
            ORDER_STATUS.RETURNED,
            ORDER_STATUS.REFUNDED,
          ],
        },
      })
      .select(
        'products additionalProducts totalPrice additionalTotalPrice deliveryFee serviceCharge discount',
      )
      .lean()
      .cursor();

    for await (const order of financialOrderCursor) {
      const calculated = summarizeOrderFinancials(order as any);
      financialSummary.revenue += calculated.revenue;
      financialSummary.qualifyingOrderCount += 1;
      if (calculated.verified) {
        financialSummary.verifiedRevenue += calculated.revenue;
        financialSummary.costOfGoodsSold += calculated.costOfGoodsSold;
        financialSummary.grossProfit += calculated.grossProfit;
        financialSummary.verifiedProfitOrderCount += 1;
      } else {
        financialSummary.unverifiedProfitOrderCount += 1;
      }
    }

    const historicalCoveragePercent = financialSummary.qualifyingOrderCount
      ? (financialSummary.verifiedProfitOrderCount /
          financialSummary.qualifyingOrderCount) *
        100
      : 100;
    const grossMarginPercent = financialSummary.verifiedRevenue
      ? (financialSummary.grossProfit / financialSummary.verifiedRevenue) * 100
      : 0;

    const points = trendRows.map((row) => ({
      label: row._id as string,
      date: row._id as string,
      orderCount: row.orderCount as number,
      totalValue: row.totalValue as number,
    }));

    const summary = points.reduce(
      (acc, point) => ({
        orderCount: acc.orderCount + point.orderCount,
        totalValue: acc.totalValue + point.totalValue,
      }),
      { orderCount: 0, totalValue: 0 },
    );

    const bucketCounts = new Map<string, number>();
    for (const row of statusRows) {
      const bucket = mapOrderStatusToPieBucket(String(row._id ?? ''));
      bucketCounts.set(
        bucket,
        (bucketCounts.get(bucket) ?? 0) + (row.count as number),
      );
    }

    const totalStatusOrders = Array.from(bucketCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    const slices = DASHBOARD_PIE_STATUSES.map((status) => {
      const count = bucketCounts.get(status) ?? 0;
      return {
        status,
        count,
        percentage:
          totalStatusOrders > 0
            ? Math.round((count / totalStatusOrders) * 1000) / 10
            : 0,
      };
    }).filter((slice) => slice.count > 0);

    return successResponse('Dashboard metrics fetched successfully', {
      trends: {
        points,
        summary,
      },
      statusBreakdown: {
        total: totalStatusOrders,
        slices,
      },
      financials: {
        ...financialSummary,
        grossMarginPercent,
        historicalCoveragePercent,
      },
      dateRange: {
        filterType: filterType ?? DateFilterType.ALL_TIME,
        startDate,
        endDate,
      },
    });
  }
}
