import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from '../entities/cart.entity';
import { Employee } from '../../employee/entities/employee.entity';
import { FirebaseService } from '../../notification/firebase/firebase.service';
import { EmployeeRole } from '../../employee/interface/employee.interface';
import { BusinessCustomer } from '../../business/schema/business.schema';
import { QUEUE_NAMES } from '../../jobs/constants';

interface CartNotificationJob {
  businessId: string;
  carts: ProcessedCart[];
  notificationStage: number;
}

interface ProcessedCart {
  cartKey: string;
  itemIds: Types.ObjectId[];
  businessId: Types.ObjectId;
  branchId?: Types.ObjectId;
  oldestItemDate: Date;
  newestItemDate: Date;
  lastNotificationSentAt?: Date;
  notificationCount: number;
  itemCount: number;
  branchName?: string;
}

@Processor(QUEUE_NAMES.CART_ABANDONMENT)
export class CartNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(CartNotificationProcessor.name);

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    private firebaseService: FirebaseService,
  ) {
    super();
  }

  async process(job: Job<CartNotificationJob>) {
    const { businessId, carts, notificationStage } = job.data;

    this.logger.debug(
      `Processing notification job for business ${businessId} (Stage: ${notificationStage})`,
    );

    try {
      // Get business details
      const business = await this.getBusinessDetails(businessId);
      if (!business) {
        throw new Error(`Business ${businessId} not found`);
      }

      // Group carts by branch
      const branchGroups = this.groupCartsByBranch(carts);
      const totalItems = carts.reduce((sum, cart) => sum + cart.itemCount, 0);

      // Send business owner notification
      await this.sendBusinessNotification(business, {
        title: this.getTitle(notificationStage),
        body: this.getBusinessBody(
          notificationStage,
          carts.length,
          totalItems,
          branchGroups.size,
        ),
        notificationStage,
      });

      // Send branch manager notifications
      await this.sendBranchNotifications(branchGroups, notificationStage);

      // Update cart notification status
      await this.updateCartNotificationStatus(carts, notificationStage);

      this.logger.log(
        `Successfully processed notifications for business ${businessId}: ${carts.length} carts, ${totalItems} items`,
      );

      return {
        businessId,
        cartsProcessed: carts.length,
        itemsProcessed: totalItems,
        notificationStage,
        branchesNotified: branchGroups.size,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process notification for business ${businessId}`,
        error.stack,
      );
      throw error;
    }
  }

  private getTitle(stage: number): string {
    return stage === 1
      ? 'Items Waiting in Your Cart'
      : 'Action Needed on Pending Carts';
  }

  private getBusinessBody(
    stage: number,
    cartCount: number,
    itemCount: number,
    branchCount: number,
  ): string {
    return stage === 1
      ? `You have ${itemCount} items in ${cartCount} pending cart(s) across ${branchCount} branches for the past 3 days. Complete your orders to avoid delays.`
      : `Your carts have been inactive for 5 days. Finalize ${cartCount} pending orders across ${branchCount} branches to avoid stock or supply delay`;
  }

  private getManagerBody(
    stage: number,
    itemCount: number,
    branchName: string,
  ): string {
    return stage === 1
      ? `You have ${itemCount} item(s) pending in cart at ${branchName}. These have been awaiting checkout for 3 days. Please review and complete the orders.`
      : `Final reminder: ${itemCount} item(s) pending in cart at ${branchName} have been pending for 5 days. Complete checkout now to prevent expiration or stock issues.`;
  }

  private groupCartsByBranch(carts: ProcessedCart[]): Map<string, any> {
    const branchGroups = new Map();

    for (const cart of carts) {
      const branchId = cart.branchId?.toString() || 'no-branch';

      if (!branchGroups.has(branchId)) {
        branchGroups.set(branchId, {
          branchId,
          branchName: cart.branchName || 'HQ Branch',
          carts: [],
          totalItems: 0,
          totalCarts: 0,
        });
      }

      const branchGroup = branchGroups.get(branchId);
      branchGroup.carts.push(cart);
      branchGroup.totalCarts++;
      branchGroup.totalItems += cart.itemCount;
    }

    return branchGroups;
  }

  private async sendBusinessNotification(
    business: any,
    { title, body }: any,
  ): Promise<void> {
    if (!business.notificationTokens?.length) {
      this.logger.debug(`No notification tokens for business ${business._id}`);
      return;
    }

    try {
      await this.firebaseService.sendMulticast(
        business.notificationTokens,
        title,
        body,
      );
      this.logger.debug(`Sent business notification to ${business._id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send business notification to ${business._id}`,
        error.stack,
      );
    }
  }

  private async sendBranchNotifications(
    branchGroups: Map<string, any>,
    notificationStage: number,
  ): Promise<void> {
    const notificationPromises = [];

    for (const [branchId, branchGroup] of branchGroups) {
      if (branchId === 'no-branch') continue;

      notificationPromises.push(
        this.sendBranchNotification(branchGroup, notificationStage),
      );
    }

    await Promise.allSettled(notificationPromises);
  }

  private async sendBranchNotification(
    branchGroup: any,
    notificationStage: number,
  ): Promise<void> {
    try {
      const managers = await this.employeeModel
        .find({
          businessId: branchGroup.carts[0].businessId,
          branchId: branchGroup.branchId,
          role: EmployeeRole.MANAGER,
          notificationToken: { $exists: true, $ne: '' },
        })
        .lean();

      if (managers.length === 0) return;

      const managerTokens = managers.map((m) => m.notificationToken);
      const body = this.getManagerBody(
        notificationStage,
        branchGroup.totalItems,
        branchGroup.branchName,
      );

      await this.firebaseService.sendMulticast(
        managerTokens,
        this.getTitle(notificationStage),
        body,
      );

      this.logger.debug(
        `Sent notification to ${managers.length} managers at branch ${branchGroup.branchId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send branch notification to ${branchGroup.branchId}`,
        error.stack,
      );
    }
  }

  private async updateCartNotificationStatus(
    carts: ProcessedCart[],
    notificationStage: number,
  ): Promise<void> {
    const updatePromises = carts.map((cart) =>
      this.cartModel.updateMany(
        { _id: { $in: cart.itemIds } },
        {
          $set: {
            lastAbandonedNotificationSentAt: new Date(),
            abandonedNotificationCount: notificationStage,
          },
        },
      ),
    );

    await Promise.all(updatePromises);
  }

  private async getBusinessDetails(businessId: string): Promise<any> {
    const business = await this.businessModel.findById(businessId).lean();
    return {
      _id: businessId,
      businessName: business.businessName,
      notificationTokens: business.notificationTokens,
    };
  }
}
