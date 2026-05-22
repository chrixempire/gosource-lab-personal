import { OrderDocument } from '../../../order/entities/order.entity';
import { BusinessCustomerDocument } from '../../../business/schema/business.schema';

export class OrderStatusChangedEvent {
  constructor(
    public readonly order: OrderDocument,
    public readonly status: string,
    public readonly message: string,
    public readonly subject: string,
    public readonly admin: any,
    public readonly customer: BusinessCustomerDocument,
  ) {}
}
