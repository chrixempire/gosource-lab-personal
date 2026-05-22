import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderController } from './purchaseorder.controller';
import { PurchaseOrderService } from './purchaseorder.service';

describe('PurchaseorderController', () => {
  let controller: PurchaseOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrderController],
      providers: [PurchaseOrderService],
    }).compile();

    controller = module.get<PurchaseOrderController>(PurchaseOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
