import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from '../order/entities/order.entity';
import { Model, Types } from 'mongoose';
import { QueryParamsDto } from './dto/query-param.dto';
import { Product, ProductDocument } from '../product/entities/product.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Branch, BranchDocument } from '../branch/entities/branch.entity';

export interface IProcurementSummary {
  [productName: string]: {
    quantity: number;
    amountSpent: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
  ) {}

  async getProcurementSummary(
    branchId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { filterBy, filterValue, startDate, endDate } = queryParams;

    let filter: any = {};
    if (filterBy && filterValue) {
      filter = { [filterBy]: filterValue };
    }

    filter['id'] = branchId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const orders: OrderDocument[] = await this.orderModel.find(filter).exec();

    // const detailedOverview = orders.map((order) => {
    //   const totalCost = order.products.reduce(
    //     (acc, curr) => acc + curr.quantity * curr.totalPrice,
    //     0,
    //   );
    //   return {
    //     orderId: order._id,
    //     totalCost,
    //     items: order.products.map((product) => ({
    //       name: product.name,
    //       quantity: product.quantity,
    //       price: product.totalPrice,
    //       total: product.quantity * product.totalPrice,
    //     })),
    //   };
    // });

    return {
      status: true,
      message: 'Orders fetched successfully',
      data: {
        orders,
      },
    };
  }

  /**
   * Get orders by branch.
   *
   * @param branchId
   * @param queryParams
   * @returns {object}
   */
  async getOrdersByBranch(
    branchId: string,
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

    filter['branch'] = branchId;

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
        totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        orders,
      },
    };
  }

  /**
   * Get procured items.
   *
   * @param branchId
   * @param queryParams
   * @returns
   */
  async getProcuredItemsByBranch(
    branchId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const {
      sortBy,
      sortOrder,
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

    filter['branch'] = branchId;

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
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const detailedOverview = orders.map((order) => {
      let total: number = order.serviceCharge + order.deliveryFee;

      const items = order.products.map((item: any) => {
        const product = item.product;
        const specialPrice = product.specialPrices.find(
          (sp) => sp.customerId === order.business.toString(),
        );
        const price = specialPrice ? specialPrice.price : product.discountPrice;
        const itemTotal = price * item.quantity;
        total += itemTotal;

        return {
          name: product.name,
          quantity: item.quantity,
          price: price,
          total: itemTotal,
        };
      });

      return {
        orderId: order._id,
        totalCost: total,
        items: items,
      };
    });

    return {
      status: true,
      message: 'Orders fetched successfully',
      data: {
        totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        detailedOverview,
      },
    };
  }

  /**
   * Get total procurements.
   *
   * @param branchId
   * @param queryParams
   * @returns
   */
  async getTotalProcurement(
    branchId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { startDate, endDate } = queryParams;

    // Convert dates to ISO format for MongoDB queries
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch orders for the given period
    const orders = await this.orderModel
      .find({
        branch: branchId,
        createdAt: { $gte: start, $lte: end },
      })
      .populate('products.product');

    if (!orders.length) {
      throw new NotFoundException(
        'No orders found for the specified period and branch.',
      );
    }

    const procurementSummary: IProcurementSummary = {};
    let totalAmountSpent = 0;

    orders.forEach((order) => {
      order.products.forEach((cartItem) => {
        let total: number = 0;
        const product = cartItem.product;
        const specialPrice = product.specialPrices.find(
          (sp) => sp.customerId === order.business.toString(),
        );
        const price = specialPrice ? specialPrice.price : product.discountPrice;
        const itemTotal = price * cartItem.quantity;
        total += itemTotal;

        const productName = cartItem.product.name;
        const amountSpent = total;

        if (!procurementSummary[productName]) {
          procurementSummary[productName] = { quantity: 0, amountSpent: 0 };
        }

        procurementSummary[productName].quantity += cartItem.quantity;
        procurementSummary[productName].amountSpent += amountSpent;
        totalAmountSpent += amountSpent;
      });
    });

    // Fetch orders for the previous period for comparison
    const previousPeriodEnd = start;
    const previousPeriodStart = new Date(start);
    previousPeriodStart.setMonth(
      start.getMonth() - (end.getMonth() - start.getMonth()),
    );

    const previousOrders = await this.orderModel
      .find({
        branch: branchId,
        createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
      })
      .populate('products.product');

    const previousProcurementSummary: any = {};

    let previousTotalAmountSpent = 0;

    previousOrders.forEach((order) => {
      order.products.forEach((cartItem) => {
        let total: number = 0;
        const product = cartItem.product;
        const specialPrice = product.specialPrices.find(
          (sp) => sp.customerId === order.business.toString(),
        );
        const price = specialPrice ? specialPrice.price : product.discountPrice;
        const itemTotal = price * cartItem.quantity;
        total += itemTotal;

        const productName = cartItem.product.name;
        const amountSpent = total;

        if (!previousProcurementSummary[productName]) {
          previousProcurementSummary[productName] = {
            quantity: 0,
            amountSpent: 0,
          };
        }

        previousProcurementSummary[productName].quantity += cartItem.quantity;
        previousProcurementSummary[productName].amountSpent += amountSpent;
        previousTotalAmountSpent += amountSpent;
      });
    });

    // Calculate percentage changes
    const percentageChanges = {};

    for (const [productName, summary] of Object.entries(procurementSummary)) {
      const previousSummary = previousProcurementSummary[productName] || {
        quantity: 0,
        amountSpent: 0,
      };
      const amountChange = summary.amountSpent - previousSummary.amountSpent;
      const percentageChange = previousSummary.amountSpent
        ? (amountChange / previousSummary.amountSpent) * 100
        : 100;

      percentageChanges[productName] = percentageChange;
    }

    return {
      status: true,
      message: 'Procurements fetched successfully',
      data: {
        totalAmountSpent,
        procurementSummary,
        percentageChanges,
        previousTotalAmountSpent,
      },
    };
  }

  /**
   * Get top procured items.
   *
   * @param branchId
   * @param queryParams
   * @returns {object}
   */
  async getTopProcuredItems(
    branchId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { sortBy = 'quantity' } = queryParams;

    // Fetch orders for the given period
    const orders = await this.orderModel
      .find({
        branch: branchId,
      })
      .populate({
        path: 'products',
        populate: {
          path: 'product',
          model: 'Product',
        },
      });

    if (!orders.length) {
      return {
        status: true,
        message: 'Items fetched successfully',
        data: [],
      };
    }

    const itemProcurementSummary = {};

    orders.forEach((order) => {
      order.products.forEach((cartItem) => {
        let total: number = 0;
        let product: ProductDocument;

        if (!cartItem.cartProduct) {
          product = cartItem.product;
        } else {
          product = cartItem.cartProduct;
        }
        if (product.version === 'v2') {
          const unit = JSON.parse(product.unit);
          const price = unit[cartItem.unit];
          if (isNaN(price)) {
            total += product.discountPrice * cartItem.quantity;
          } else {
            total += price * cartItem.quantity;
          }
        } else {
          const specialPrice = product.specialPrices.find(
            (sp) => sp.customerId === order.business.toString(),
          );
          const price = specialPrice
            ? specialPrice.price
            : product.discountPrice;
          const itemTotal = price * cartItem.quantity;
          total += itemTotal;
        }

        const productName = product.name;
        const amountSpent = total;

        if (!itemProcurementSummary[productName]) {
          itemProcurementSummary[productName] = { quantity: 0, totalCost: 0 };
        }

        itemProcurementSummary[productName].quantity += cartItem.quantity;
        itemProcurementSummary[productName].totalCost += amountSpent;
      });
    });

    // Convert summary object to an array for sorting
    const itemArray = Object.entries(itemProcurementSummary).map(
      ([name, summary]) => ({
        name,
        summary,
      }),
    );

    // Sort items based on the specified criteria
    itemArray.sort((a, b) => b[sortBy] - a[sortBy]);

    const top10Items = itemArray.slice(0, 10);

    return {
      status: true,
      message: 'Items fetched successfully',
      data: top10Items,
    };
  }

  /**
   * Get price trend.
   *
   * @param branchId
   * @param queryParams
   * @returns {object}
   */
  async getPriceTrend(
    branchId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { startDate, endDate, productId } = queryParams;

    // Convert dates to ISO format for MongoDB queries
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch orders for the given period
    const orders = await this.orderModel
      .find({
        branch: branchId,
        createdAt: { $gte: start, $lte: end },
      })
      .populate('products.product');

    if (!orders.length) {
      throw new NotFoundException(
        'No orders found for the specified period and branch.',
      );
    }

    const priceTrends = {};

    orders.forEach((order: any) => {
      order.products.forEach((cartItem) => {
        const product = cartItem.product;
        if (productId && product._id.toString() !== productId) {
          return;
        }

        const productName = product.name;
        const orderDate = order.createdAt.toISOString().split('T')[0];
        const price = product.discountPrice;

        if (!priceTrends[productName]) {
          priceTrends[productName] = [];
        }

        priceTrends[productName].push({ date: orderDate, price });
      });
    });

    return {
      status: true,
      message: 'Price trend fetched successfully',
      data: priceTrends,
    };
  }

  /**
   * Get top procured items.
   *
   * @param branchId
   * @param queryParams
   * @returns
   */
  async getTopProcuredProducts(
    branchId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { startDate, endDate, sortBy = 'totalAmount' } = queryParams;

    // Convert dates to ISO format for MongoDB queries
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch orders for the given period
    const orders = await this.orderModel
      .find({
        branch: branchId,
        createdAt: { $gte: start, $lte: end },
      })
      .populate('products.product');

    if (!orders.length) {
      throw new NotFoundException(
        'No orders found for the specified period and branch.',
      );
    }

    const productSummary = {};

    orders.forEach((order) => {
      order.products.forEach((cartItem) => {
        const productName = cartItem.product.name;
        const amountSpent = cartItem.totalPrice;

        if (!productSummary[productName]) {
          productSummary[productName] = { quantity: 0, totalAmount: 0 };
        }

        productSummary[productName].quantity += cartItem.quantity;
        productSummary[productName].totalAmount += amountSpent;
      });
    });

    // Convert summary object to an array for sorting
    const productArray = Object.entries(productSummary).map(
      ([name, summary]) => ({
        name,
        summary,
      }),
    );

    // Sort items based on the specified criteria
    productArray.sort((a, b) => b[sortBy] - a[sortBy]);

    // Get top 20 products
    const topProducts = productArray.slice(0, 20);

    return {
      status: true,
      message: 'Top products fetched successfully',
      data: topProducts,
    };
  }

  /**
   * Get price increase.
   *
   * @param branchId
   * @param queryParams
   * @returns {object}
   */
  async getPriceIncrease(
    branchId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { startDate, endDate } = queryParams;

    // Convert dates to ISO format for MongoDB queries
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch products with price changes within the given period
    const products = await this.productModel.find({
      updatedAt: { $gte: start, $lte: end },
    });

    if (!products.length) {
      throw new NotFoundException(
        'No products found with price changes for the specified period.',
      );
    }

    const priceChanges = products
      .map((product: any) => {
        const priceHistory = product.priceHistory; // Assuming there's a priceHistory field
        const oldPrice = priceHistory.find((record) => record.date < start);
        const newPrice = priceHistory.find(
          (record) => record.date >= start && record.date <= end,
        );

        if (!oldPrice || !newPrice) return null;

        const percentageIncrease =
          ((newPrice.price - oldPrice.price) / oldPrice.price) * 100;

        return {
          name: product.name,
          oldPrice: oldPrice.price,
          newPrice: newPrice.price,
          percentageIncrease,
        };
      })
      .filter((change) => change !== null);

    // Sort products by percentage increase and get the top 3-5 products
    priceChanges.sort((a, b) => b.percentageIncrease - a.percentageIncrease);

    return {
      status: true,
      message: 'Price increase fetched successfully',
      data: priceChanges.slice(0, 5),
    };
  }

  /**
   * Get product analysis
   * @param branchId
   * @param queryParams
   * @returns {object}
   */
  async getProductAnalysis(
    branchId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { startDate, endDate } = queryParams;

    // Convert dates to ISO format for MongoDB queries
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch orders for the given period
    const orders = await this.orderModel
      .find({
        branch: branchId,
        createdAt: { $gte: start, $lte: end },
      })
      .populate('products.product');

    if (!orders.length) {
      throw new NotFoundException(
        'No orders found for the specified period and branch.',
      );
    }

    interface ProductSummary {
      totalQuantity: number;
      totalAmountSpent: number;
      lastPurchaseDate: Date | null;
    }

    const productSummary: Record<string, ProductSummary> = {};

    orders.forEach((order: any) => {
      order.products.forEach((cartItem) => {
        let total: number = 0;
        const product = cartItem.product;
        const specialPrice = product.specialPrices.find(
          (sp) => sp.customerId === order.business.toString(),
        );
        const price = specialPrice ? specialPrice.price : product.discountPrice;
        const itemTotal = price * cartItem.quantity;
        total += itemTotal;

        const productName = cartItem.product.name;
        const amountSpent = total;
        const purchaseDate = order.createdAt;

        if (!productSummary[productName]) {
          productSummary[productName] = {
            totalQuantity: 0,
            totalAmountSpent: 0,
            lastPurchaseDate: null,
          };
        }

        productSummary[productName].totalQuantity += cartItem.quantity;
        productSummary[productName].totalAmountSpent += amountSpent;
        if (
          !productSummary[productName].lastPurchaseDate ||
          purchaseDate > productSummary[productName].lastPurchaseDate
        ) {
          productSummary[productName].lastPurchaseDate = purchaseDate;
        }
      });
    });

    const data = Object.entries(productSummary).map(([name, summary]) => ({
      name,
      totalQuantity: summary.totalQuantity,
      totalAmountSpent: summary.totalAmountSpent,
      lastPurchaseDate: summary.lastPurchaseDate,
    }));

    return {
      status: true,
      message: 'Product analysis fetched successfully',
      data,
    };
  }

  async getOrderFrequency(businessId: string): Promise<any> {
    const orders: OrderDocument[] = await this.orderModel
      .find({
        business: businessId,
      })
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
      .exec();

    const data = orders.reduce((acc, order) => {
      const state = order.address.state;
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});

    return {
      status: true,
      data: data,
    };
  }

  async getOrderHistoryTrends(businessId: string): Promise<any> {
    const orders: OrderDocument[] = await this.orderModel
      .find({
        business: businessId,
      })
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
      .exec();

    const data = orders.reduce((acc, order: any) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + order.totalPrice;
      return acc;
    }, {});

    return {
      data,
    };
  }

  async getTopPurchasedProducts(businessId: string): Promise<any> {
    const orders: OrderDocument[] = await this.orderModel
      .find({
        business: businessId,
      })
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
      .exec();

    const productMap = {};
    orders.forEach((order) => {
      order.products.forEach((product) => {
        const name = product.product.name;
        productMap[name] = (productMap[name] || 0) + product.quantity;
      });
    });

    const data = Object.entries(productMap).sort(
      (a: any, b: any) => b[1] - a[1],
    );

    return {
      data,
    };
  }

  async getBranchPerformance(businessId: string): Promise<any> {
    const orders: OrderDocument[] = await this.orderModel
      .find({
        business: businessId,
      })
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
      .exec();

    const data = orders.reduce((acc, order) => {
      const branch = order.branch.branchName;
      acc[branch] = acc[branch] || { totalOrders: 0, totalValue: 0 };
      acc[branch].totalOrders += 1;
      acc[branch].totalValue += order.totalPrice;
      return acc;
    }, {});

    return { data };
  }

  async getProductPriceVariability(businessId: string): Promise<any> {
    const orders: OrderDocument[] = await this.orderModel
      .find({
        business: businessId,
      })
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
      .exec();

    const priceTrends = {};
    orders.forEach((order: any) => {
      order.products.forEach((product: any) => {
        const productName = product.product.name;
        priceTrends[productName] = priceTrends[productName] || [];
        priceTrends[productName].push({
          date: new Date(order.createdAt).toISOString().split('T')[0],
          price: product.product.discountPrice,
        });
      });
    });
    return priceTrends;
  }

  async getMostPurchasedItems(orders: OrderDocument[]): Promise<any> {
    const itemCounts: { [key: string]: any } = {};

    orders.forEach((order) => {
      order.products.forEach((product) => {
        let item: any;
        if (!product.cartProduct) {
          item = product.product;
        } else {
          item = product.cartProduct;
        }

        const productId = item._id.toString();
        if (itemCounts[productId]) {
          itemCounts[productId].quantity += product.quantity;
        } else {
          itemCounts[productId] = {
            productId: productId,
            name: item.name,
            quantity: product.quantity,
            lastPurchasePrice: item.discountPrice || item.actualPrice,
            image: item.images,
          };
        }
      });
    });

    // Sort items by purchase count
    const sortedItems = Object.values(itemCounts).sort(
      (a: any, b: any) => b.quantity - a.quantity,
    );

    return sortedItems;
  }

  async getCurrentPrice(productId: any): Promise<any> {
    const product: ProductDocument =
      await this.productModel.findById(productId);
    const currentPrice = product.discountPrice || product.actualPrice;
    return currentPrice;
  }

  /**
   * Get dashboard analytics.
   *
   * @param business
   * @returns {object}
   */
  async getAnalyticsData(business: any): Promise<any> {
    let branchId: any;
    if (business.user_type === 'BUSINESS' && !business.branchId) {
      const branch: BranchDocument = await this.branchModel.findOne({
        isHeadquarter: true,
        businessId: business.id,
      });

      if (!branch) {
        return {
          status: true,
          message: 'Data fetched successfully',
          data: [],
        };
      }

      branchId = branch._id;
    } else {
      branchId = new Types.ObjectId(business.branchId);
    }

    const orders: OrderDocument[] = await this.orderModel
      .find({
        branch: branchId,
      })
      .populate({
        path: 'products',
        populate: {
          path: 'product',
          model: 'Product',
        },
      })
      .exec();

    const mostPurchasedItems: any = await this.getMostPurchasedItems(orders);
    const top10MostPurchasedItems = mostPurchasedItems.slice(0, 10);

    const analyticsData = await Promise.all(
      top10MostPurchasedItems.map(async (item: any) => {
        const currentPrice = await this.getCurrentPrice(item.productId);
        const lastPurchasePrice = item.lastPurchasePrice;

        const percentageChange =
          ((currentPrice - lastPurchasePrice) / lastPurchasePrice) * 100;

        return {
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          lastPurchasePrice: lastPurchasePrice,
          currentPrice: currentPrice,
          percentageChange: percentageChange.toFixed(2),
          image: item.image,
        };
      }),
    );

    return {
      status: true,
      message: 'Data fetched successfully',
      data: analyticsData,
    };
  }

  /**
   * Get total per day.
   *
   * @param business
   * @returns {object}
   */
  async getTotalPerDayForWeek(business: any): Promise<any> {
    let branchId: any;
    if (business.user_type === 'BUSINESS' && !business.branchId) {
      const branch: BranchDocument = await this.branchModel.findOne({
        isHeadquarter: true,
        businessId: business.id,
      });

      if (!branch) {
        return {
          status: true,
          message: 'Data fetched successfully',
          data: [],
        };
      }

      branchId = branch._id;
    } else {
      branchId = new Types.ObjectId(business.branchId);
    }

    const startOfWeek = new Date();
    const endOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    endOfWeek.setHours(23, 59, 59, 999);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const orders: OrderDocument[] = await this.orderModel
      .find({
        branch: branchId,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      })
      .populate({
        path: 'products',
        populate: {
          path: 'product',
          model: 'Product',
        },
      });

    const totalsPerDay = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Calculate the total per day
    orders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      const dayName = dayNames[orderDate.getDay()]; // Get the day of the week as a string

      // Calculate the total price for the order
      const totalPrice = order.totalPrice;

      // Add the total price to the respective day
      if (totalsPerDay.hasOwnProperty(dayName)) {
        totalsPerDay[dayName] += totalPrice;
      }
    });

    return {
      status: true,
      message: 'Data fetched successfully',
      data: totalsPerDay,
    };
  }

  /**
   * Get General stats for the dashboard.
   *
   * @param business
   * @returns {object}
   */
  async getGeneralStats(business: any): Promise<any> {
    let branchId: any;
    if (business.user_type === 'BUSINESS' && !business.branchId) {
      const branch: BranchDocument = await this.branchModel.findOne({
        isHeadquarter: true,
        businessId: business.id,
      });

      if (!branch) {
        return {
          status: true,
          message: 'Data fetched successfully',
          data: {
            totalOrders: [],
            totalOrdersAmount: 0,
            totalEmployees: [],
          },
        };
      }

      branchId = branch._id;
    } else {
      branchId = new Types.ObjectId(business.branchId);
    }

    const [totalOrders, totalOrdersAmount, employee] = await Promise.all([
      this.orderModel.countDocuments({ branch: branchId }),
      this.orderModel.aggregate([
        {
          $match: {
            branch: branchId,
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalPrice' },
          },
        },
      ]),
      this.employeeModel.countDocuments({ branchId: branchId }),
    ]);

    return {
      status: true,
      message: 'Data fetched successfully',
      data: {
        totalOrders,
        totalOrdersAmount:
          totalOrdersAmount.length > 0 ? totalOrdersAmount[0].totalAmount : 0,
        totalEmployees: employee,
      },
    };
  }
}
