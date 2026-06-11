import { Injectable, NotFoundException } from '@nestjs/common';
import { PdfUtil } from '../utils/pdfWriter';
import { buildOrderInvoiceViewModel } from '../utils/order-invoice-view';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './entities/order.entity';
import { Model, Types } from 'mongoose';
import { Cart } from 'src/cart/entities/cart.entity';
import { Product } from 'src/product/entities/product.entity';
import { ORDER_PAYMENT_STATUS } from './interface/order.interface';
import { Timeline } from './entities/timeline.entity';
import { PaymentReference } from '../paystack/schema/paymentReference.schema';
import { BusinessCustomer } from '../business/schema/business.schema';
import { Request, RequestDocument } from '../request/schema/request.schema';
import { PaymentStatus } from '../request/enum/request.enum';
import { OrderFilterUtil } from '../utils/filter';
@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Timeline.name)
    private timelineModel: Model<Timeline>,
    @InjectModel(PaymentReference.name)
    private paymentReferenceModel: Model<PaymentReference>,
    @InjectModel(Request.name) private requestModel: Model<Request>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
  ) {}

  async calculateOrderPrice(order: Order, business: string) {
    let total = 0;
    const cartPorducts: Cart[] = order.products;
    cartPorducts.forEach((item: Cart) => {
      const product: Product = item.product;

      // Check for V2 products (Multi-unit)
      if (product.version === 'v2') {
        let unitData;

        // Prioritize discountedUnit if available
        if (product.discountedUnit) {
          try {
            unitData = JSON.parse(product.discountedUnit);
          } catch (e) {
            // Fallback if parsing fails
            unitData = JSON.parse(product.unit);
          }
        } else {
          unitData = JSON.parse(product.unit);
        }

        const price = unitData[item.unit];
        if (isNaN(price)) {
          // Fallback to discountPrice if unit price missing
          total += product.discountPrice * item.quantity;
        } else {
          total += price * item.quantity;
        }
      } else {
        // Legacy (V1) Logic
        const specialPrice = product.specialPrices.find((item) => {
          return item.customerId === business;
        });
        const price = specialPrice ? specialPrice.price : product.discountPrice;
        total += price * item.quantity;
      }
    });
    total += order.deliveryFee;
    total += order.serviceCharge;
    return total;
  }

  async orderSummary(branch: string) {
    const aggregate = [
      {
        $match: {
          branch: new Types.ObjectId(branch),
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];
    const data = await this.orderModel.aggregate(aggregate);
    return this.buildResponse(data);
  }

  async findAll(queryParams: any, business: any) {
    const {
      limit = 10,
      page = 1,
      filterBy,
      filterValue,
      status,
      startDate,
      endDate,
      branchId,
      amountFrom,
      amountTo,
    } = queryParams;

    let filter: any = {};
    if (filterBy && filterValue) {
      filter = { [filterBy]: filterValue };
    }

    if (status) {
      const statuses = String(status)
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      if (statuses.length === 1) {
        filter.status = statuses[0];
      } else if (statuses.length > 1) {
        filter.status = { $in: statuses };
      }
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

    const amountFromNum =
      amountFrom != null && amountFrom !== '' ? Number(amountFrom) : undefined;
    const amountToNum = amountTo != null && amountTo !== '' ? Number(amountTo) : undefined;
    Object.assign(
      filter,
      OrderFilterUtil.buildFilterQuery({
        amountFrom: Number.isFinite(amountFromNum) ? amountFromNum : undefined,
        amountTo: Number.isFinite(amountToNum) ? amountToNum : undefined,
      }),
    );

    if (business.role !== 'Super Admin' && business.branchId) {
      filter.branch = new Types.ObjectId(`${business.branchId}`);
    } else if (branchId) {
      filter.branch = new Types.ObjectId(`${branchId}`);
    }

    filter.$or = [];
    if (business.user_type === 'BUSINESS') {
      filter.$or.push({ business: new Types.ObjectId(`${business.id}`) });
      filter.$or.push({ customerId: new Types.ObjectId(`${business.id}`) });
      // if (business.branchId) {
      //   filter.$or.push({ branch: business.branchId });
      // }
    }

    if (filter.$or.length === 0) {
      delete filter.$or;
    }

    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number(limit) > 0 ? Number(limit) : 10;

    const [total, orders]: [number, OrderDocument[]] = await Promise.all([
      this.orderModel.countDocuments(filter),
      this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
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
      .exec(),
    ]);

    const modifiedOrders = orders.map((order) => {
      return {
        ...order.toObject(),
        status: order.status.toLowerCase(),
      };
    });

    const minimumKnownTotal = (safePage - 1) * safeLimit + modifiedOrders.length;
    const resolvedTotal =
      modifiedOrders.length < safeLimit
        ? Math.max(total, minimumKnownTotal)
        : total;

    return {
      status: true,
      message: 'Orders fetched successfully',
      data: modifiedOrders,
      meta: {
        total: resolvedTotal,
        page: safePage,
        limit: safeLimit,
      },
    };
  }

  async downloadInvoice(orderId: string, business: any): Promise<Buffer> {
    const orderResponse = await this.findOne(orderId);
    const order = orderResponse?.data;
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.assertCanAccessOrder(order, business);

    const invoiceView = buildOrderInvoiceViewModel(order);
    return PdfUtil.generatePdf(invoiceView, 'order_invoice');
  }

  private assertCanAccessOrder(order: any, actor: any) {
    const userType = String(actor?.user_type ?? '').toUpperCase();
    const orderBusinessId = String(
      order.business?._id ?? order.business ?? order.customerId ?? '',
    );
    const orderCustomerId = String(order.customerId ?? '');
    const orderBranchId = String(order.branch?._id ?? order.branch ?? '');

    if (userType === 'EMPLOYEE') {
      const actorBusinessId = String(actor?.businessId ?? '');
      const actorBranchId = String(actor?.branchId ?? '');

      if (
        actorBusinessId &&
        orderBusinessId &&
        orderBusinessId !== actorBusinessId &&
        orderCustomerId !== actorBusinessId
      ) {
        throw new NotFoundException('Order not found');
      }

      if (actorBranchId && orderBranchId && orderBranchId !== actorBranchId) {
        throw new NotFoundException('Order not found');
      }

      return;
    }

    const actorBusinessId = String(actor?.id ?? '');
    if (
      actorBusinessId &&
      orderBusinessId &&
      orderBusinessId !== actorBusinessId &&
      orderCustomerId !== actorBusinessId
    ) {
      throw new NotFoundException('Order not found');
    }
  }

  async findOne(id: string): Promise<any> {
    const order = await this.orderModel
      .findById(id)
      .populate('business')
      .populate({
        path: 'request',
        populate: {
          path: 'initiator',
          model: 'Employee',
        },
      })
      .populate({
        path: 'products',
        populate: {
          path: 'product',
          model: 'Product',
        },
      })
      .populate('branch')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.request?.initiator) {
      const altRequest: RequestDocument = await this.requestModel.findById(
        order.request?._id,
      );
      order.request.initiator = await this.businessModel.findById(
        altRequest?.initiator,
      );
    }

    const timeline: Timeline[] = await this.timelineModel.find({
      order: order._id,
    });

    const orderData = order.toObject();
    const orderWithTimeline = {
      ...orderData,
      approver: orderData.business,
      timeline,
    };

    return this.buildResponse(orderWithTimeline, 'Order fetched successfully');
  }

  async updateOrderFromWebhook(
    orderId: string,
    paymentReference: string,
  ): Promise<any> {
    const [order, request] = await Promise.all([
      this.orderModel.findById(orderId),
      this.requestModel.findById(orderId),
    ]);

    if (!order && !request) {
      return;
    }

    if (order) {
      order.paymentStatus = ORDER_PAYMENT_STATUS.PAID;
      await order.save();
      if (order.request) {
        await this.requestModel.findByIdAndUpdate(order.request, {
          paymentStatus: PaymentStatus.PAID,
        });
      }
    }

    if (request) {
      request.paymentStatus = PaymentStatus.PAID;
      await request.save();
      await this.orderModel.updateMany(
        { request: request._id },
        { paymentStatus: ORDER_PAYMENT_STATUS.PAID },
      );
    }

    // Save Reference
    await this.paymentReferenceModel.create({
      data: paymentReference,
    });

    return;
  }

  buildResponse(data: any, message: string = 'successfully') {
    return {
      status: true,
      message,
      data,
    };
  }

  /**
   * Get order timeline.
   *
   * @param orderId
   * @returns
   */
  async getTimeline(orderId: string): Promise<any> {
    const timeline: Timeline[] = await this.timelineModel.find({
      order: orderId,
    });

    return {
      status: true,
      message: 'Timeline fetched successfully',
      data: timeline,
    };
  }
}
