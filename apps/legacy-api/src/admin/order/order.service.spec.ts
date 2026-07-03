import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../../order/entities/order.entity';
import { BusinessCustomer } from '../../business/schema/business.schema';
import { Timeline } from '../../order/entities/timeline.entity';
import { Product } from '../../product/entities/product.entity';
import { OrderActivityLog } from '../../order/entities/activity.entity';
import { ActivityLog } from '../../activity/schema/activityLog.schema';
import { InventoryMovement } from '../../product/entities/inventoryMovement.entity';
import { RequestService } from '../../request/request.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_PAYMENT_STATUS } from '../../order/interface/order.interface';
import { Employee } from '../../employee/entities/employee.entity';
import { Request } from '../../request/schema/request.schema';

describe('OrderService', () => {
  let service: OrderService;

  const mockModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockRequestService = {
    deductProductQuantity: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken(Order.name), useValue: mockModel },
        { provide: getModelToken(BusinessCustomer.name), useValue: mockModel },
        { provide: getModelToken(Timeline.name), useValue: mockModel },
        { provide: getModelToken(Product.name), useValue: mockModel },
        { provide: getModelToken(OrderActivityLog.name), useValue: mockModel },
        { provide: getModelToken(ActivityLog.name), useValue: mockModel },
        { provide: getModelToken(InventoryMovement.name), useValue: mockModel },
        { provide: getModelToken(Employee.name), useValue: mockModel },
        { provide: getModelToken(Request.name), useValue: mockModel },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: RequestService, useValue: mockRequestService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updatePaymentStatus — stock deduction on mark-as-paid', () => {
    const admin = { firstName: 'A', lastName: 'B' };

    function makeOrder(overrides: Record<string, unknown> = {}) {
      return {
        _id: 'order-1',
        paymentStatus: ORDER_PAYMENT_STATUS.PENDING,
        paymentCount: 0,
        products: [],
        additionalProducts: [],
        additionalTotalPrice: 0,
        totalPrice: 1000,
        business: 'business-1',
        discount: 0,
        paidAt: null,
        ...overrides,
      };
    }

    function arrange(order: Record<string, unknown>) {
      // findById(orderId).populate(...).exec() -> order
      mockModel.findById.mockReturnValue({
        populate: () => ({ exec: () => Promise.resolve(order) }),
      });
      // findByIdAndUpdate returns a truthy updated order so the method completes
      mockModel.findByIdAndUpdate.mockResolvedValue({ ...order });
      mockModel.create.mockResolvedValue({});
    }

    it('does NOT deduct again when the order is already paid (webhook already confirmed it)', async () => {
      arrange(
        makeOrder({ paymentStatus: ORDER_PAYMENT_STATUS.PAID, paymentCount: 1 }),
      );

      await service.updatePaymentStatus(
        'order-1',
        { status: ORDER_PAYMENT_STATUS.PAID },
        admin,
      );

      expect(mockRequestService.deductProductQuantity).not.toHaveBeenCalled();
    });

    it('deducts base stock exactly once on the first transition to paid (paymentCount 0)', async () => {
      arrange(
        makeOrder({
          paymentStatus: ORDER_PAYMENT_STATUS.PENDING,
          paymentCount: 0,
        }),
      );

      await service.updatePaymentStatus(
        'order-1',
        { status: ORDER_PAYMENT_STATUS.PAID },
        admin,
      );

      expect(mockRequestService.deductProductQuantity).toHaveBeenCalledTimes(1);
    });

    it('deducts only additional products (once) when base was already deducted at approval (paymentCount 1, still unpaid)', async () => {
      const additionalProducts = [{ product: 'p1', quantity: 2 }];
      arrange(
        makeOrder({
          paymentStatus: ORDER_PAYMENT_STATUS.PENDING,
          paymentCount: 1,
          additionalProducts,
        }),
      );

      await service.updatePaymentStatus(
        'order-1',
        { status: ORDER_PAYMENT_STATUS.PAID },
        admin,
      );

      expect(mockRequestService.deductProductQuantity).toHaveBeenCalledTimes(1);
      expect(mockRequestService.deductProductQuantity).toHaveBeenCalledWith(
        additionalProducts,
      );
    });

    it('does not deduct when transitioning to a non-paid status', async () => {
      arrange(makeOrder({ paymentStatus: ORDER_PAYMENT_STATUS.PENDING }));

      await service.updatePaymentStatus(
        'order-1',
        { status: ORDER_PAYMENT_STATUS.PARTIAL },
        admin,
      );

      expect(mockRequestService.deductProductQuantity).not.toHaveBeenCalled();
    });
  });
});
