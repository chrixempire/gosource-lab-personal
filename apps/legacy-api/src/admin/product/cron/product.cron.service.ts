import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Product,
  ProductDocument,
} from '../../../product/entities/product.entity';
import { Order, OrderDocument } from '../../../order/entities/order.entity';
import {
  AdminUser,
  AdminUserDocument,
} from '../../auth/schema/adminUser.schema';
import { EmailService } from '../../../notification/email/email.service';
import { RedisLockService } from '../../../utils/redis-lock.service';
import { startOfDay, endOfDay } from 'date-fns';
import { AdminAccountStatus } from '../../auth/enum/admin.enum';

@Injectable()
export class ProductCronService {
  private readonly logger = new Logger(ProductCronService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUserDocument>,
    private readonly emailService: EmailService,
    private readonly redisLock: RedisLockService,
  ) {}

  @Cron('0 18 * * *', {
    name: 'cob-low-stock-report',
    timeZone: 'Africa/Lagos',
  })
  async sendCOBLowStockReport() {
    const lockKey = 'cob-low-stock-report-lock';
    let hasLock = false;

    try {
      hasLock = await this.redisLock.acquireLock(lockKey);

      if (!hasLock) {
        return;
      }

      this.logger.debug('Running COB low stock report...');
      const now = new Date();
      const start = startOfDay(now);
      const end = endOfDay(now);

      // 1. Find all orders created today
      const todaysOrders = await this.orderModel
        .find({
          createdAt: { $gte: start, $lte: end },
        })
        .select('products.product');

      if (!todaysOrders.length) {
        this.logger.debug('No orders found today. Skipping COB report.');
        return;
      }

      // 2. Extract unique product IDs
      const productIds = new Set<string>();
      todaysOrders.forEach((order) => {
        order.products?.forEach((item) => {
          if (item.product) {
            productIds.add(item.product.toString());
          }
        });
      });

      if (productIds.size === 0) {
        this.logger.debug(
          'No products found in today orders. Skipping COB report.',
        );
        return;
      }

      // 3. Query these products for low stock or out of stock
      const affectedProducts = await this.productModel
        .find({
          _id: { $in: Array.from(productIds) },
          $or: [
            { isLowStock: true },
            { inStock: false },
            { quantity: { $lt: 1 } },
          ],
        })
        .select('name quantity inStock');

      if (affectedProducts.length === 0) {
        this.logger.debug(
          'No low stock sold products found today. Skipping COB report.',
        );
        return;
      }

      // 4. Generate HTML rows
      let productsTableRows = '';
      affectedProducts.forEach((product) => {
        const isOutOfStock = product.quantity < 1 || !product.inStock;
        const statusText = isOutOfStock ? 'Out of Stock' : 'Low Stock';
        const statusColor = isOutOfStock ? '#DC2626' : '#D97706'; // Red vs Orange

        productsTableRows += `
          <tr>
              <td style="height: 32px; padding-top: 8px; padding-bottom: 8px; border-bottom: 1px solid #E4E7EC;">${product.name || 'Unknown Product'}</td>
              <td style="height: 32px; padding-top: 8px; padding-bottom: 8px; border-bottom: 1px solid #E4E7EC; text-align: center;">${product.quantity}</td>
              <td style="height: 32px; padding-top: 8px; padding-bottom: 8px; border-bottom: 1px solid #E4E7EC; text-align: right; color: ${statusColor};"><b>${statusText}</b></td>
          </tr>
        `;
      });

      // 5. Fetch active admin emails with roles 'admin' or 'store'
      const admins = await this.adminUserModel
        .find({ status: AdminAccountStatus.ACTIVE })
        .populate('roleId');

      let adminEmails = admins
        .filter((a) => {
          const role = a.roleId as any;
          if (!role || !role.name) return false;
          const roleName = role.name.toLowerCase();
          return roleName === 'admin' || roleName === 'store';
        })
        .map((a) => a.email)
        .filter(Boolean);

      if (adminEmails.length === 0) {
        this.logger.warn(
          'No active admins found to send COB report. Use provided emails: [EMAIL_ADDRESS]',
        );

        adminEmails = [
          'test@ipc-africa.com',
          'hanifah@ipc-africa.com',
          'quadrii@ipc-africa.com',
        ];
      }

      // 6. Send Email
      for (const email of adminEmails) {
        try {
          await this.emailService.sendMail({
            to: email,
            subject: `Daily COB Low Stock Report - ${now.toDateString()}`,
            template: 'cob-low-stock-report',
            variables: {
              PRODUCTS_TABLE_ROWS: productsTableRows,
              DATE: now.toDateString(),
            },
          });
        } catch (emailError) {
          this.logger.error(
            `Failed to send COB low stock report to ${email}`,
            emailError,
          );
        }
      }

      this.logger.log(
        `COB low stock report sent to ${adminEmails.length} admins.`,
      );
    } catch (error: any) {
      this.logger.error('Failed to send COB low stock report:', error);
    } finally {
      if (hasLock) {
        await this.redisLock.releaseLock(lockKey);
      }
    }
  }
}
