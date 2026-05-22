import { ProductDocument } from '../../../product/entities/product.entity';
import { INITIATOR_TYPE } from '../../../activity/interface/activityLog.interface';

export class ProductStockUpdatedEvent {
  constructor(
    public readonly product: ProductDocument,
    public readonly quantityChanged: number,
    public readonly movementType: string,
    public readonly reference: string,
    public readonly movementDescription: string,
    public readonly activityLogDescription: string,
    public readonly initiator: any = null,
    public readonly initiatorType: string = INITIATOR_TYPE.ADMIN,
    public readonly metadata: any = {},
    public readonly relatedDocumentId?: string,
  ) {}
}
