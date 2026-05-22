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
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: RequestService, useValue: mockRequestService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
