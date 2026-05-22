import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { format } from 'date-fns';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';
import { Timeline } from '../../../order/entities/timeline.entity';
import { OrderActivityLog } from '../../../order/entities/activity.entity';
import { EmailService } from '../../../notification/email/email.service';
import { NewEmailInterface } from '../../../notification/email/email.interface';
import { ORDER_STATUS } from '../../../order/interface/order.interface';
import { FirebaseService } from '../../../notification/firebase/firebase.service';
import { Employee } from '../../../employee/entities/employee.entity';
import { EmployeeRole } from '../../../employee/interface/employee.interface';
import { Request as OrderRequest } from '../../../request/schema/request.schema';

@Injectable()
export class OrderListener {
  private readonly logger = new Logger(OrderListener.name);
  constructor(
    @InjectModel(Timeline.name)
    private timelineModel: Model<Timeline>,
    @InjectModel(OrderActivityLog.name)
    private orderActivityLogModel: Model<OrderActivityLog>,
    @InjectModel(Employee.name)
    private employeeModel: Model<Employee>,
    @InjectModel(OrderRequest.name)
    private requestModel: Model<OrderRequest>,
    private emailService: EmailService,
    private firebaseService: FirebaseService,
  ) {}

  @OnEvent('order.status.changed')
  async handleOrderStatusChangedEvent(event: OrderStatusChangedEvent) {
    this.logger.log(
      `Received order.status.changed event for order: ${event.order?._id}`,
    );
    const { order, status, message, subject, admin, customer } = event;

    // 1. Create Timeline
    const timelineDetails = {
      title: message,
      description: subject,
      order: order._id,
    };
    await this.timelineModel.create(timelineDetails);

    // 2. Create Activity Log
    await this.orderActivityLogModel.create({
      order: order._id,
      description:
        status === ORDER_STATUS.CANCELLED
          ? `Order cancelled: ${order.cancellationReason}`
          : `Order status updated to ${status}`,
      initiator: `${admin.firstName} ${admin.lastName}`,
    });

    // 3. Send Email
    // Only send if we have a valid subject
    if (subject) {
      const emailData: NewEmailInterface = {
        to: customer.email,
        subject,
        template: 'new-order',
        variables: {
          TIME: format(new Date(), 'hh:mm a'),
          DATE: format(new Date(), 'MMMM d, yyyy'),
          STATE: order.address.state,
          LGA: order.address.lga,
          STREET_ADDRESS: order.address.streetAddress,
          PHONE_NUMBER: order.phoneNumber,
          FULLNAME: `${customer.firstName} ${customer.lastName}`,
          PAYMENT_METHOD: order.paymentMethod,
          SERVICE_CHARGE: Intl.NumberFormat().format(order.serviceCharge),
          DELIVERY_FEE: Intl.NumberFormat().format(order.deliveryFee),
          SUB_TOTAL: Intl.NumberFormat().format(order.totalPrice),
          TOTAL_PRICE: Intl.NumberFormat().format(order.totalPrice),
          ORDER_ID: order.reference,
          BUSINESS: customer.businessName,
          SUBJECT: subject,
        },
      };

      await this.emailService.sendMail(emailData);
    }

    // 4. Send Push Notification
    const notificationPromises = [];

    // Notify Business Customer
    if (customer?.notificationTokens?.length > 0) {
      this.logger.log(
        `Sending push notification to business customer: ${customer._id}`,
      );
      notificationPromises.push(
        this.firebaseService.sendMulticast(
          customer.notificationTokens,
          `Order ${message || 'update'}`,
          subject,
        ),
      );
    }

    // 4.1 Notify Initiator (Check if they are an Employee)
    try {
      if (order.request) {
        const requestData = await this.requestModel.findById(order.request);
        if (requestData?.initiator) {
          const initiatorId = requestData.initiator.toString();

          // Try fetching as Employee
          const employeeInitiator =
            await this.employeeModel.findById(initiatorId);
          if (employeeInitiator?.notificationToken) {
            this.logger.log(
              `Sending push notification to employee initiator: ${initiatorId}`,
            );
            notificationPromises.push(
              this.firebaseService.sendPushNotification(
                employeeInitiator.notificationToken,
                `Order ${message || 'update'}`,
                subject,
              ),
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error notifying initiator: ${error.message}`);
    }

    if (notificationPromises.length > 0) {
      await Promise.all(notificationPromises);
    }

    // 5. Send Push Notification to Managers
    // const managers = await this.employeeModel.find({
    //   businessId: customer._id,
    //   role: EmployeeRole.MANAGER,
    //   branchId: order.branch,
    //   notificationToken: { $exists: true, $ne: '' },
    // });

    // if (managers.length > 0) {
    //   const managerTokens = managers.map((m) => m.notificationToken);
    //   await this.firebaseService.sendMulticast(
    //     managerTokens,
    //     subject || 'Order Update',
    //     message,
    //   );
    // }
  }
}
