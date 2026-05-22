import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JOB_NAMES, QUEUE_NAMES } from '../../jobs/constants';
import { EmailService } from '../../notification/email/email.service';
import { FirebaseService } from '../../notification/firebase/firebase.service';
import { CreditAccount } from '../../credit/schema/creditAccount.schema';
import { CreditRequest } from '../../credit/schema/creditRequest';
import { RepaymentSchedule } from '../../credit/schema/repaymentSchedule.schema';
import { CreditStatus } from '../../credit/enum/credit.enum';
import {
  RepaymentStatus,
  PaymentMethod,
} from '../../credit/enum/repayment.enum';
import { createMoney } from '../../utils/money';

interface CreditNotificationJob {
  type: 'repayment' | 'upcoming' | 'overdue';
  creditAccountId: string;
  amountInKobo?: number;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  repaymentId?: string;
}

interface AdminCreditNotificationJob {
  businessId: string;
  email: {
    subject: string;
    template: string;
    variables: any;
  };
  push: {
    title: string;
    body: string;
  };
}

@Processor(QUEUE_NAMES.CREDIT_REPAYMENT)
export class CreditNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(CreditNotificationProcessor.name);

  constructor(
    @InjectModel(CreditAccount.name)
    private creditAccountModel: Model<CreditAccount>,
    @InjectModel(CreditRequest.name)
    private creditRequestModel: Model<CreditRequest>,
    @InjectModel(RepaymentSchedule.name)
    private repaymentScheduleModel: Model<RepaymentSchedule>,
    private emailService: EmailService,
    private firebaseService: FirebaseService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    const { type } = job.data;
    const name = job.name;
    this.logger.debug(`Processing credit notification job: ${name} (${type})`);

    try {
      if (name === JOB_NAMES.SEND_ADMIN_CREDIT_NOTIFICATION) {
        await this.handleAdminNotification(job.data);
      } else {
        switch (type) {
          case 'repayment':
            await this.handleRepaymentNotification(job.data);
            break;
          case 'upcoming':
          case 'overdue':
            await this.handleCronNotification(job.data);
            break;
          default:
            this.logger.warn(`Unknown job type: ${type}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to process job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async handleAdminNotification(data: AdminCreditNotificationJob) {
    const { businessId, email, push } = data;

    const business = await (
      this.creditAccountModel.db.model('BusinessCustomer') as Model<any>
    )
      .findById(businessId)
      .lean();
    if (!business) return;

    await this.sendNotifications(
      business,
      email.subject,
      email.template,
      email.variables,
      push.title,
      push.body,
    );
  }

  private async handleRepaymentNotification(data: CreditNotificationJob) {
    const {
      creditAccountId,
      amountInKobo,
      paymentMethod,
      transactionReference,
    } = data;

    const creditAccount = await this.creditAccountModel
      .findById(creditAccountId)
      .populate('business');

    if (!creditAccount || !creditAccount.business) return;

    const business = creditAccount.business as any;
    const amountNaira = createMoney(amountInKobo, 'kobo').format();
    const date = new Date().toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Check for completed loans
    const completedRequests = await this.creditRequestModel.find({
      creditAccount: creditAccountId,
      status: CreditStatus.COMPLETED,
      completionPaymentDate: { $gte: new Date(Date.now() - 60000) },
    });

    const isLoanRepaid = completedRequests.length > 0;
    const templateName = isLoanRepaid
      ? 'loan-repaid'
      : 'credit-payment-confirmation';
    const subject = isLoanRepaid
      ? 'Loan Fully Repaid'
      : 'Credit Repayment Confirmation';

    const nextPayment = await this.repaymentScheduleModel
      .findOne({
        creditAccount: creditAccountId,
        status: {
          $in: [
            RepaymentStatus.PENDING,
            RepaymentStatus.PARTIALLY_PAID,
            RepaymentStatus.OVERDUE,
          ],
        },
      })
      .sort({ dueDate: 1 });

    const templateData = {
      BUSINESS_NAME: business.businessName,
      AMOUNT: amountNaira,
      DATE: date,
      PAYMENT_METHOD: paymentMethod,
      REMAINING_BALANCE: createMoney(
        creditAccount.outstandingKobo,
        'kobo',
      ).format(),
      NEXT_PAYMENT_DATE: nextPayment
        ? nextPayment.dueDate.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : 'N/A',
    };

    await this.sendNotifications(
      business,
      subject,
      templateName,
      templateData,
      isLoanRepaid ? 'Loan Fully Repaid! 🎉' : 'Repayment Successful',
      `Your repayment of ${amountNaira} was successful. ${isLoanRepaid ? 'Your loan has been fully settled.' : ''}`,
    );
  }

  private async handleCronNotification(data: CreditNotificationJob) {
    const { repaymentId, creditAccountId, type } = data;
    const repayment = await this.repaymentScheduleModel
      .findById(repaymentId)
      .populate('business');
    if (!repayment || !repayment.business) return;

    const business = repayment.business as any;
    const creditAccount =
      await this.creditAccountModel.findById(creditAccountId);

    const isUpcoming = type === 'upcoming';
    const templateName = isUpcoming
      ? 'credit-upcoming-reminder'
      : 'credit-overdue-notice';
    const subject = isUpcoming
      ? 'Upcoming Repayment Reminder'
      : 'Credit Overdue Notice';
    const pushTitle = isUpcoming
      ? 'Upcoming Repayment Reminder 📅'
      : 'Credit Overdue Notice ⚠️';

    const amountNaira = createMoney(
      repayment.remainingAmountKobo,
      'kobo',
    ).format();
    const pushBody = isUpcoming
      ? `Your repayment of ${amountNaira} is due on ${repayment.dueDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}.`
      : `Your repayment of ${amountNaira} is ${repayment.daysOverdue} days overdue. Please settle immediately.`;

    const templateData = {
      BUSINESS_NAME: business.businessName,
      AMOUNT: createMoney(repayment.totalAmountKobo, 'kobo').format(),
      AMOUNT_OVERDUE: amountNaira,
      DUE_DATE: repayment.dueDate.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      DAYS_OVERDUE: repayment.daysOverdue,
      PENALTY_FEE: createMoney(
        (repayment.overdueChargesKobo || 0) + (repayment.lateFeesKobo || 0),
        'kobo',
      ).format(),
      TOTAL_OUTSTANDING: creditAccount
        ? createMoney(creditAccount.outstandingKobo, 'kobo').format()
        : 'N/A',
      REMAINING_BALANCE: amountNaira,
    };

    await this.sendNotifications(
      business,
      subject,
      templateName,
      templateData,
      pushTitle,
      pushBody,
    );
  }

  private async sendNotifications(
    business: any,
    subject: string,
    template: string,
    data: any,
    pushTitle: string,
    pushBody: string,
  ) {
    // Send Email
    await this.emailService.sendMail({
      to: business.email,
      subject,
      template,
      variables: data,
    });

    // Send Push
    if (business.notificationTokens?.length > 0) {
      await this.firebaseService.sendMulticast(
        business.notificationTokens,
        pushTitle,
        pushBody,
      );
    }
  }
}
