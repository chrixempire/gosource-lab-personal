import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ProductStockUpdatedEvent } from '../events/product-stock-updated.event';
import { Product, ProductDocument } from '../../../product/entities/product.entity';
import { InventoryMovement } from '../../../product/entities/inventoryMovement.entity';
import { ActivityLog } from '../../../activity/schema/activityLog.schema';
import { ACTIVITY_LOG_ACTION_TYPE } from '../../../activity/interface/activityLog.interface';

@Injectable()
export class ProductListener {
  private readonly logger = new Logger(ProductListener.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(InventoryMovement.name)
    private inventoryMovementModel: Model<InventoryMovement>,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLog>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @OnEvent('product.stock.updated')
  async handleProductStockUpdatedEvent(event: ProductStockUpdatedEvent) {
    const {
      product,
      quantityChanged,
      movementType,
      reference,
      movementDescription,
      activityLogDescription,
      initiator,
      initiatorType,
      metadata,
      relatedDocumentId,
    } = event;

    this.logger.log(
      `Handling product.stock.updated for product: ${product._id} (${product.name})`,
    );

    try {
      // 1. Update stock and low stock status if quantity is tracked
      if (product.trackQuantity) {
        const updates: any = {};
        let hasUpdates = false;

        if (product.lowStockLevel != null) {
          const isLowStock = product.quantity <= product.lowStockLevel;
          if (product.isLowStock !== isLowStock) {
            updates.isLowStock = isLowStock;
            hasUpdates = true;
          }
        }

        const inStock = product.quantity >= 1;
        if (product.inStock !== inStock) {
          updates.inStock = inStock;
          hasUpdates = true;
        }

        if (hasUpdates) {
          await this.productModel.updateOne(
            { _id: product._id },
            { $set: updates },
          );
        }
      }

      // 2. Record Inventory Movement
      const movement = new this.inventoryMovementModel({
        product: product._id,
        branch: null, // Default to null, can be expanded if needed
        movementType,
        quantity: Math.abs(quantityChanged),
        unit: product.purchaseUnit,
        reference,
        description: movementDescription,
        relatedDocumentId,
        movementDate: new Date(),
        runningBalance: product.quantity,
      });
      await movement.save();

      // 3. Create Activity Log
      const newQuantity = Number(product.quantity);
      const delta = Number(quantityChanged);
      const previousQuantity =
        Number.isFinite(newQuantity) && Number.isFinite(delta)
          ? newQuantity - delta
          : null;

      const enrichedMetadata: Record<string, any> = {
        ...(metadata ?? {}),
        productName: product.name,
        productDescription: product.description,
      };

      // Record the stock movement as an old → new quantity change.
      if (previousQuantity != null && delta !== 0) {
        enrichedMetadata.changes = {
          ...(enrichedMetadata.changes ?? {}),
          Quantity: { old: previousQuantity, new: newQuantity },
        };
      }

      const activityLog = {
        objectId: product._id.toString(),
        description: activityLogDescription,
        initiator,
        initiatorType,
        metadata: enrichedMetadata,
        module: Product.name,
        action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      };
      await this.activityLogModel.create(activityLog);

      // 4. Invalidate Caches
      await this.cacheManager.del('all_products_sorted');
      await this.cacheManager.del('categories_with_products');

      this.logger.log(`Stock update side effects completed for product: ${product._id}`);
    } catch (error) {
      this.logger.error(
        `Error handling product.stock.updated for product ${product._id}: ${error.message}`,
      );
    }
  }
}
