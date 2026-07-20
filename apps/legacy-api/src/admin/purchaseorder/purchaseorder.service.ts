import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreatePurchaseOrderDto } from './dto/create-purchaseorder.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from './entities/purchaseorder.entity';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductStockUpdatedEvent } from '../product/events/product-stock-updated.event';
import {
  Product,
  ProductDocument,
} from '../../product/entities/product.entity';
import {
  Category,
} from '../../category/entities/category.entity';
import { ReceivedItemsDto } from './dto/other.dto';
import { EmailService } from '../../notification/email/email.service';
import { PurchaseOrderStatus } from './interface/purchaseorder.interface';
import { PurchaseOrderCart } from './entities/cart.entity';
import { NewEmailInterface } from '../../notification/email/email.interface';
import { AdminUser } from '../auth/schema/adminUser.schema';
import { PdfUtil } from '../../utils/pdfWriter';
import { FilterPurchaseOrderDto } from './dto/filter - purchaseorder.dto';
import {
  ACTIVITY_LOG_ACTION_TYPE,
  IActivityLog,
  INITIATOR_TYPE,
} from '../../activity/interface/activityLog.interface';
import { ActivityLog } from '../../activity/schema/activityLog.schema';
import { createMoney } from '../../utils/money';
import { adminInitiator } from '../../utils/activity-initiator.util';
import {
  buildChanges,
  describeChanges,
  formatLogDate,
  formatIdList,
} from '../../utils/activity-changes.util';

const formatPoLines = (value: unknown) => {
  if (!Array.isArray(value)) return value ?? null;
  return value
    .map((line: any) => {
      const product = line?.product;
      const name =
        product && typeof product === 'object'
          ? (product.name ?? product._id ?? product)
          : (product ?? '');
      return `${name} (×${line?.quantity ?? ''})`;
    })
    .sort();
};

const PURCHASE_ORDER_LOG_FIELDS = [
  { key: 'suppliers', label: 'suppliers', format: formatIdList },
  { key: 'note', label: 'note' },
  { key: 'expectedDate', label: 'expected date', format: formatLogDate },
  { key: 'productType', label: 'product type' },
  { key: 'logisticsAmount', label: 'logistics amount' },
  { key: 'products', label: 'items', format: formatPoLines },
];

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectModel(PurchaseOrderCart.name)
    private cartModel: Model<PurchaseOrderCart>,
    @InjectModel(PurchaseOrder.name)
    private purchaseOrderModel: Model<PurchaseOrder>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private emailService: EmailService,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Sends purchase order receipt email to all suppliers
   * @param purchaseOrderId - The ID of the purchase order
   * @param updated - Whether this is an update notification (default: false)
   * @param extraData - Additional data containing host information for download URL
   */
  async sendReceiptEmail(
    purchaseOrderId: string,
    updated = false,
    extraData: any,
  ) {
    const purchaseOrder = await this.findOne(purchaseOrderId);

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    const host = extraData?.host ?? extraData?.Host;
    if (!host || typeof host !== 'string') {
      throw new BadRequestException(
        'Host header is required to build the invoice download link',
      );
    }

    const suppliers = (purchaseOrder.suppliers ?? []) as AdminUser[];
    if (!suppliers.length) {
      throw new BadRequestException('Purchase order has no suppliers');
    }

    const creatorUser = purchaseOrder.creator;
    const creator = creatorUser
      ? `${creatorUser.lastName ?? ''} ${creatorUser.firstName ?? ''}`.trim()
      : 'Unknown';
    const subject = !updated ? 'Purchase Order' : 'Purchase Order Updated';
    const numberOfProducts = purchaseOrder.products?.length ?? 0;
    const orderId = String(purchaseOrder.id ?? purchaseOrder._id);
    const downloadReceiptUrl = `https://${host}/v2/admin/purchase-order/${orderId}/send-invoice`;

    try {
      await Promise.all(
        suppliers.map(async (supplier: AdminUser) => {
          const emailData: NewEmailInterface = {
            to: supplier.email,
            subject,
            template: 'purchase-order-receipt',
            variables: {
              supplierName: `${supplier.lastName ?? ''} ${supplier.firstName ?? ''}`.trim(),
              numberOfProducts,
              creator,
              downloadReceiptUrl,
            },
          };
          await this.emailService.sendMail(emailData);
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send purchase order receipt email';
      throw new ServiceUnavailableException(message);
    }
  }

  /**
   * Re-sends purchase order receipt email to all suppliers (manual "Send invoice").
   */
  async resendReceiptEmail(purchaseOrderId: string, headers: any) {
    await this.sendReceiptEmail(purchaseOrderId, false, headers);
    return {
      status: true,
      message: 'Purchase order receipt sent to suppliers',
    };
  }

  /**
   * Creates a new purchase order
   * @param createPurchaseOrderDto - Data transfer object containing purchase order details
   * @param request - HTTP request object containing user information
   * @returns Object with status, message, and created purchase order data
   */
  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    request: Request,
  ) {
    const { products } = createPurchaseOrderDto;

    // Check if all the products exist in the database
    const productIds = products.map((item) => item.product);

    const existingProducts = await this.productModel
      .find({ _id: { $in: productIds } })
      .exec();

    if (existingProducts.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products do not exist in the database',
      );
    }

    const user = request['user'];
    createPurchaseOrderDto['creator'] = user.id;
    const newPurchaseOrder = await this.purchaseOrderModel.create(
      createPurchaseOrderDto,
    );

    // Capture a full snapshot of what was ordered into the activity log so the
    // audit trail shows the items, prices and supplier — not just a count.
    // Supplier names are read via a throwaway populated query so the returned
    // `newPurchaseOrder` keeps its id refs (the API response shape is unchanged).
    const productNameById = new Map(
      existingProducts.map((p) => [String(p._id), p.name]),
    );
    const items = products.map((item) => ({
      name: productNameById.get(String(item.product)) ?? 'Unknown product',
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    }));
    const itemsTotal = items.reduce(
      (sum, item) => sum + (Number(item.totalPrice) || 0),
      0,
    );

    let supplierNames: string[] = [];
    try {
      const populated = await this.purchaseOrderModel
        .findById(newPurchaseOrder.id)
        .populate('suppliers', 'firstName lastName email')
        .lean();
      supplierNames = ((populated?.suppliers as any[]) ?? []).map((s) => {
        const name = [s?.firstName, s?.lastName].filter(Boolean).join(' ').trim();
        return name || s?.email || 'Unknown supplier';
      });
    } catch {
      // Best-effort: fall back to raw supplier ids if the lookup fails.
      supplierNames = (newPurchaseOrder.suppliers ?? []).map((id) => String(id));
    }

    await this.activityLogModel.create({
      objectId: newPurchaseOrder.id,
      description: `Created purchase order with ${newPurchaseOrder.products?.length ?? 0} item(s)`,
      ...adminInitiator(user),
      metadata: {
        itemCount: items.length,
        items,
        itemsTotal,
        suppliers: supplierNames.join(', '),
        logisticsAmount: newPurchaseOrder.logisticsAmount ?? 0,
        productType: newPurchaseOrder.productType ?? null,
        note: newPurchaseOrder.note ?? '',
      },
      action: ACTIVITY_LOG_ACTION_TYPE.CREATE,
      module: PurchaseOrder.name,
    } as IActivityLog);

    this.sendReceiptEmail(newPurchaseOrder.id, false, request.headers);
    return {
      status: true,
      message: 'Purchase Order created successfully',
      data: newPurchaseOrder,
    };
  }

  /**
   * Adds quantities to multiple products (bulk operation)
   * Updates product inventory and creates activity logs for each product
   * @param products - Array of products with their quantities to add
   */
  async addToQuantity(products: any): Promise<void> {
    const productIds = products.map((item) => item.product);
    const existingProducts = await this.productModel
      .find({ _id: { $in: productIds } })
      .exec();

    if (existingProducts.length !== productIds.length) {
      return;
    }

    for (const item of products) {
      const product = existingProducts.find(
        (p) => p._id.toString() === item.product.toString(),
      );

      if (product?.trackQuantity) {
        const totalAdditionCost = product.marketPrice * item.quantity;

        // Update product atomically with incremented quantity and price
        const updatedProduct: ProductDocument =
          await this.productModel.findByIdAndUpdate(
            product._id,
            {
              $inc: {
                quantity: item.quantity,
                totalPrice: totalAdditionCost,
              },
            },
            {
              new: true,
            },
          );

        if (updatedProduct) {
          const description = `Quantity ${item.quantity} ${updatedProduct.purchaseUnit} worth ${createMoney(totalAdditionCost, 'naira').format()} of the market price added from purchase order. Remaining ${updatedProduct.quantity} quantity`;
          this.eventEmitter.emit(
            'product.stock.updated',
            new ProductStockUpdatedEvent(
              updatedProduct,
              +item.quantity,
              'ADDITION',
              'PURCHASE_ORDER',
              description,
              description,
            ),
          );
        }
      }
    }
  }

  /**
   * Adds quantity to a single product when items are received from purchase order
   * Updates product inventory and creates activity log entry
   * @param productId - The ID of the product to update
   * @param quantityToAdd - The quantity to add to the product inventory
   */
  async addToQuantitySingle(
    productId: string,
    quantityToAdd: number,
    reference: string = 'PURCHASE_ORDER',
    admin?: any,
  ): Promise<void> {
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      return;
    }

    if (product.trackQuantity) {
      const totalAdditionCost = product.marketPrice * quantityToAdd;

      // Update product atomically with incremented quantity and price
      const updatedProduct: ProductDocument =
        await this.productModel.findByIdAndUpdate(
          productId,
          {
            $inc: {
              quantity: quantityToAdd,
              totalPrice: totalAdditionCost,
            },
          },
          {
            new: true,
          },
        );

      if (updatedProduct) {
        const description = `Quantity ${quantityToAdd} ${updatedProduct.purchaseUnit} worth ${createMoney(totalAdditionCost, 'naira').format()} of the market price added from received purchase order items. Remaining ${updatedProduct.quantity} quantity`;

        this.eventEmitter.emit(
          'product.stock.updated',
          new ProductStockUpdatedEvent(
            updatedProduct,
            quantityToAdd,
            'ADDITION',
            'PURCHASE_ORDER',
            description,
            description,
            admin?.id ?? admin?._id ?? null,
            INITIATOR_TYPE.ADMIN,
          ),
        );
      }
    } else {
      // Product doesn't track quantity — there's no inventory movement to
      // record, but still log the receipt so every received item gets its own
      // activity row (mirrors the tracked-item log shape / module). Guarded so
      // logging never breaks the receive.
      try {
        await this.activityLogModel.create({
          objectId: product._id.toString(),
          description: `Quantity ${quantityToAdd} ${product.purchaseUnit} of ${product.name} received from purchase order items (quantity not tracked)`,
          ...adminInitiator(admin),
          metadata: {
            productName: product.name,
            productDescription: product.description,
            reference,
            quantityReceived: quantityToAdd,
            trackQuantity: false,
          },
          action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
          module: Product.name,
        } as IActivityLog);
      } catch {
        // never throw from activity logging
      }
    }
  }

  /**
   * Retrieves all purchase orders with filtering, sorting, and pagination
   * @param queryParams - Filter parameters including pagination, sorting, and status filters
   * @returns Object containing purchase orders data with pagination info and status counts
   */
  async findAll(queryParams: FilterPurchaseOrderDto): Promise<any> {
    let filter = queryParams.buildQueryCondition();
    const {
      sortBy,
      sortOrder,
      limit = 200,
      page = 1,
      filterBy,
      filterValue,
      id,
    } = queryParams;

    if (id) {
      filter = {
        $expr: {
          $regexMatch: {
            input: { $toString: '$_id' },
            regex: id,
            options: 'i',
          },
        },
      };
    } else if (filterBy && filterValue) {
      filter = { [filterBy]: filterValue };
    }

    const statFiltered = await this.purchaseOrderModel.aggregate([
      {
        $match: { ...filter },
      },
      {
        $project: {
          status: 1,
          logisticsAmount: 1,
          orderTotal: {
            $sum: {
              $map: {
                input: '$products',
                as: 'p',
                in: '$$p.totalPrice',
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalPrice: { $sum: '$orderTotal' },
          totalLogistics: { $sum: '$logisticsAmount' },

          pendingCount: {
            $sum: {
              $cond: [{ $eq: ['$status', PurchaseOrderStatus.PENDING] }, 1, 0],
            },
          },
          completeCount: {
            $sum: {
              $cond: [{ $eq: ['$status', PurchaseOrderStatus.COMPLETE] }, 1, 0],
            },
          },
          partialCount: {
            $sum: {
              $cond: [{ $eq: ['$status', PurchaseOrderStatus.PARTIAL] }, 1, 0],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
    const totalDocuments = statFiltered[0]?.totalDocuments || 0;
    const purchaseOrders: PurchaseOrderDocument[] =
      await this.purchaseOrderModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('suppliers')
        .populate('creator')
        .populate('products.product')
        .exec();

    return {
      status: true,
      message: 'Purchase Orders fetched successfully',
      data: {
        totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        purchaseOrders,
        stats: statFiltered[0],
      },
    };
  }

  /**
   * Finds a single purchase order by ID with populated references
   * @param id - The purchase order ID
   * @returns Purchase order document with populated suppliers, creator, and products
   */
  async findOne(id: string): Promise<any> {
    const purchaseOrder = await this.purchaseOrderModel
      .findById(id)
      .populate('suppliers')
      .populate('creator')
      .populate('products.product')
      .exec();
    return purchaseOrder;
  }

  /**
   * Gets a single purchase order with detailed population of all references
   * @param id - The purchase order ID
   * @returns Object with status, message, and detailed purchase order data
   */
  async getSinglePurchaseOrder(id: string): Promise<{
    status: boolean;
    message: string;
    data: Record<string, unknown>;
  }> {
    const purchaseOrderDoc: PurchaseOrderDocument = await this.purchaseOrderModel
      .findOne({
        _id: id,
      })
      .populate('products.product')
      .populate('suppliers')
      .populate('creator')
      .exec();

    if (!purchaseOrderDoc) {
      throw new NotFoundException('Purchase Order not found');
    }

    const embeddedProducts = (purchaseOrderDoc.products ?? [])
      .map((item) => item.product)
      .filter((product) => Boolean(product) && typeof product === 'object')
      .map((product) => product as { category?: unknown });

    await this.enrichEmbeddedProductCategories(embeddedProducts);

    const purchaseOrder = purchaseOrderDoc.toObject({ virtuals: true });

    return {
      status: true,
      message: 'Purchase Order fetched successfully',
      data: purchaseOrder,
    };
  }

  /**
   * Product.category is Mixed (Category ObjectId or legacy name string).
   * Resolve ObjectId refs to `{ _id, name }` for admin UI; leave name strings as-is.
   */
  private async enrichEmbeddedProductCategories(
    products: Array<{ category?: unknown }>,
  ): Promise<void> {
    const categoryIds = [
      ...new Set(
        products
          .map((product) => this.resolveCategoryObjectId(product.category))
          .filter((categoryId): categoryId is string => Boolean(categoryId)),
      ),
    ];

    if (categoryIds.length === 0) {
      return;
    }

    const categories = await this.categoryModel
      .find({ _id: { $in: categoryIds.map((categoryId) => new Types.ObjectId(categoryId)) } })
      .select('name _id')
      .lean()
      .exec();

    const categoriesById = new Map(
      categories.map((category) => [String(category._id), category]),
    );

    for (const product of products) {
      const categoryId = this.resolveCategoryObjectId(product.category);
      if (!categoryId) {
        continue;
      }

      const resolved = categoriesById.get(categoryId);
      if (resolved) {
        product.category = {
          _id: String(resolved._id),
          name: resolved.name,
        };
      }
    }
  }

  private resolveCategoryObjectId(category: unknown): string | null {
    if (!category) {
      return null;
    }

    if (category instanceof Types.ObjectId) {
      return String(category);
    }

    if (typeof category === 'object') {
      if ('name' in category && '_id' in category) {
        return this.resolveCategoryObjectId((category as { _id: unknown })._id);
      }

      if ('_id' in category) {
        return this.resolveCategoryObjectId((category as { _id: unknown })._id);
      }

      return null;
    }

    if (typeof category === 'string') {
      try {
        const objectId = new Types.ObjectId(category);
        return String(objectId) === category ? category : null;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Processes received items from a purchase order
   * Updates quantities received, adds to product inventory, and updates order status
   * @param id - The purchase order ID
   * @param receivedItemsDto - DTO containing the received items data
   * @returns Object with status, message, and updated purchase order data
   */
  async receiveItems(
    id: string,
    receivedItemsDto: ReceivedItemsDto,
    admin?: any,
  ): Promise<any> {
    const { receivedItems } = receivedItemsDto;

    const purchaseOrder = await this.purchaseOrderModel.findById(id).exec();

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }

    for (const receivedItem of receivedItems) {
      const productInCart = purchaseOrder.products.find(
        (item) => item.product.toString() === receivedItem.productId,
      );

      if (!productInCart) {
        throw new NotFoundException(
          `Product with ID ${receivedItem.productId} not found in the purchase order`,
        );
      }

      productInCart.quantityReceived = productInCart.quantityReceived || 0;

      productInCart.quantityReceived += receivedItem.quantityReceived;

      if (productInCart.quantityReceived > productInCart.quantity) {
        throw new BadRequestException(
          `Quantity received for product ${receivedItem.productId} exceeds the ordered quantity`,
        );
      }

      // Add the received quantity to the product inventory
      this.addToQuantitySingle(
        receivedItem.productId,
        receivedItem.quantityReceived,
        `Purchase Order: ${purchaseOrder._id}`,
        admin,
      );

      purchaseOrder.markModified('products');
    }

    const allItemsReceived = purchaseOrder.products.every(
      (item) => item.quantityReceived >= item.quantity,
    );

    purchaseOrder.status = PurchaseOrderStatus.PARTIAL;

    if (allItemsReceived) {
      purchaseOrder.status = PurchaseOrderStatus.COMPLETE;
    }

    await purchaseOrder.save();

    // Resolve product names so the log reads clearly, and compute the
    // quantity still outstanding per received item.
    const receivedIds = receivedItems.map((item) => item.productId);
    const receivedProducts = await this.productModel
      .find({ _id: { $in: receivedIds } })
      .select('name trackQuantity')
      .lean();
    const productMap = new Map(
      receivedProducts.map((product) => [String(product._id), product]),
    );

    const receivedItemsSummary = receivedItems.map((item) => {
      const productInCart = purchaseOrder.products.find(
        (cartItem) => cartItem.product.toString() === item.productId,
      );
      const ordered = productInCart?.quantity ?? 0;
      const receivedTotal = productInCart?.quantityReceived ?? 0;
      const product = productMap.get(String(item.productId)) as any;
      return {
        productId: item.productId,
        productName: product?.name ?? 'Unknown product',
        quantityReceived: item.quantityReceived,
        quantityRemaining: Math.max(0, ordered - receivedTotal),
        // Shows why stock did (or didn't) update for this item on receipt.
        trackQuantity: Boolean(product?.trackQuantity),
      };
    });

    await this.activityLogModel.create({
      objectId: purchaseOrder.id,
      description: `Received items on purchase order — status now ${purchaseOrder.status}`,
      ...adminInitiator(admin),
      metadata: {
        status: purchaseOrder.status,
        receivedItems: receivedItemsSummary,
      },
      action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      module: PurchaseOrder.name,
    } as IActivityLog);

    return {
      status: true,
      message: 'Items received successfully',
      data: purchaseOrder,
    };
  }

  /**
   * Cancels remaining items that haven't been received
   * Removes products with zero quantity received and updates quantities for partial receipts
   * @param purchaseOrderId - The purchase order ID
   * @returns Object with status, message, and updated purchase order data
   */
  async cancelRemainingItems(purchaseOrderId: string, admin?: any) {
    const purchaseOrder = await this.purchaseOrderModel
      .findById(purchaseOrderId)
      .exec();

    if (!purchaseOrder) {
      throw new NotFoundException(
        `PurchaseOrder with ID ${purchaseOrderId} not found`,
      );
    }

    purchaseOrder.products = purchaseOrder.products.filter(
      (product) => product.quantityReceived !== 0,
    );

    purchaseOrder.products.forEach((product) => {
      product.quantity = product.quantityReceived;
    });

    await purchaseOrder.save();

    await this.activityLogModel.create({
      objectId: purchaseOrder.id,
      description: 'Cancelled remaining (un-received) items on purchase order',
      ...adminInitiator(admin),
      metadata: { status: purchaseOrder.status },
      action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      module: PurchaseOrder.name,
    } as IActivityLog);

    return {
      status: true,
      message: 'Remaining items canceled and quantities updated successfully',
      data: purchaseOrder,
    };
  }

  /**
   * Removes a purchase order (only if status is PENDING)
   * @param id - The purchase order ID
   * @returns Object with status and success message
   */
  async remove(id: string, admin?: any) {
    const purchaseOrder = await this.purchaseOrderModel.findOne({
      _id: id,
      status: PurchaseOrderStatus.PENDING,
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Pending Purchase Order not found');
    }
    await this.purchaseOrderModel.deleteOne({ _id: id });

    await this.activityLogModel.create({
      objectId: id,
      description: 'Deleted pending purchase order',
      ...adminInitiator(admin),
      metadata: {},
      action: ACTIVITY_LOG_ACTION_TYPE.DELETE,
      module: PurchaseOrder.name,
    } as IActivityLog);

    return {
      status: true,
      message: 'Purchase Order deleted successfully',
    };
  }

  /**
   * Generates and returns a PDF invoice for a purchase order
   * @param purchaseOrderId - The purchase order ID
   * @returns PDF buffer of the purchase order invoice
   */
  async sendInvoice(purchaseOrderId: string) {
    const purchaseOrder = await this.findOne(purchaseOrderId);
    if (!purchaseOrder) throw new NotFoundException('Purchase order not found');
    console.log(purchaseOrder);
    const pdfBuffer = await PdfUtil.generatePdf(
      purchaseOrder,
      'purchase_order_invoice',
    );
    return pdfBuffer;
  }

  /**
   * Removes a single item from a purchase order
   * Can only remove items that haven't been received (quantityReceived = 0)
   * @param purchaseOrderId - The purchase order ID
   * @param productId - The product ID to remove
   * @returns Object with status, message, and updated purchase order data
   */
  async removeSingleItem(
    purchaseOrderId: string,
    productId: string,
    admin?: any,
  ) {
    const purchaseOrder = await this.purchaseOrderModel
      .findById(purchaseOrderId)
      .exec();

    if (!purchaseOrder) {
      throw new NotFoundException(
        `PurchaseOrder with ID ${purchaseOrderId} not found`,
      );
    }

    if (purchaseOrder.products.length <= 1) {
      throw new BadRequestException(
        'Cannot remove the only item in the purchase order',
      );
    }

    const productIndex = purchaseOrder.products.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (productIndex === -1) {
      throw new NotFoundException(
        `Product with ID ${productId} not found in the purchase order`,
      );
    }

    const productItem = purchaseOrder.products[productIndex];
    if (productItem.quantityReceived !== 0) {
      throw new BadRequestException(
        `Cannot remove product with ID ${productId} because quantityReceived is not zero`,
      );
    }

    purchaseOrder.products.splice(productIndex, 1);

    await purchaseOrder.save();

    await this.activityLogModel.create({
      objectId: purchaseOrder.id,
      description: 'Removed an item from purchase order',
      ...adminInitiator(admin),
      metadata: { removedProductId: productId },
      action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      module: PurchaseOrder.name,
    } as IActivityLog);

    return {
      status: true,
      message: 'Product removed successfully',
      data: purchaseOrder,
    };
  }

  /**
   * Marks all items in a purchase order as fully received
   * Updates product inventory for any remaining quantities and completes the order
   * @param purchaseOrderId - The purchase order ID
   * @returns Object with status, message, and updated purchase order data
   */
  async markAllItemsAsReceived(purchaseOrderId: string, admin?: any) {
    const purchaseOrder = await this.purchaseOrderModel
      .findById(purchaseOrderId)
      .exec();

    if (!purchaseOrder) {
      throw new NotFoundException(
        `PurchaseOrder with ID ${purchaseOrderId} not found`,
      );
    }

    // Update quantities for products that haven't been fully received yet
    for (const product of purchaseOrder.products) {
      const remainingQuantity =
        product.quantity - (product.quantityReceived || 0);
      if (remainingQuantity > 0) {
        this.addToQuantitySingle(
          product.product.toString(),
          remainingQuantity,
          `Purchase Order Completion: ${purchaseOrder._id}`,
          admin,
        );
      }
      product.quantityReceived = product.quantity;
    }

    purchaseOrder.status = PurchaseOrderStatus.COMPLETE;

    await purchaseOrder.save();

    await this.activityLogModel.create({
      objectId: purchaseOrder.id,
      description: 'Marked all items received — purchase order completed',
      ...adminInitiator(admin),
      metadata: { status: purchaseOrder.status },
      action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      module: PurchaseOrder.name,
    } as IActivityLog);

    return {
      status: true,
      message: 'All items marked as received and purchase order completed',
      data: purchaseOrder,
    };
  }

  /**
   * Updates an existing purchase order with new data
   * @param purchaseOrderId - The purchase order ID to update
   * @param purchaseOrderData - The data to update the purchase order with
   * @returns Object with status, message, and updated purchase order data
   */
  async update(
    purchaseOrderId: string,
    purchaseOrderData: any,
    admin?: any,
  ): Promise<any> {
    const purchaseOrder: PurchaseOrderDocument =
      await this.purchaseOrderModel
        .findById(purchaseOrderId)
        .populate('products.product');

    if (!purchaseOrder) {
      throw new NotFoundException('PurchaseOrder not found');
    }

    const update = await this.purchaseOrderModel
      .findByIdAndUpdate(
        purchaseOrderId,
        {
          ...purchaseOrderData,
        },
        { new: true },
      )
      .populate('products.product');

    if (update) {
      const changes = buildChanges(
        purchaseOrder.toObject() as unknown as Record<string, unknown>,
        update.toObject() as unknown as Record<string, unknown>,
        PURCHASE_ORDER_LOG_FIELDS,
      );
      await this.activityLogModel.create({
        objectId: purchaseOrderId,
        description: describeChanges('purchase order', undefined, changes),
        ...adminInitiator(admin),
        metadata: { changes },
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
        module: PurchaseOrder.name,
      } as IActivityLog);

      return {
        status: true,
        message: 'PurchaseOrder updated successfully',
        data: update,
      };
    }
  }
}
