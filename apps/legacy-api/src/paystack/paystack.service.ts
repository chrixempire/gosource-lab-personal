import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ExternalService } from '../external/external.service';
import {
  InitializePaystackPaymentInterface,
  INuban,
} from './interface/paystack.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Webhook } from './schema/webhook.schema';
import { Model } from 'mongoose';
import { PaymentReference } from './schema/paymentReference.schema';
import { InvoiceService } from '../admin/invoice/invoice.service';
import { createHmac } from 'crypto';
import { OrderService } from '../order/order.service';
import { WalletService } from '../wallet/wallet.service';
import { CreditRepaymentService } from '../credit-repayment/credit-repayment.service';

@Injectable()
export class PaystackService {
  constructor(
    private externalService: ExternalService,
    @InjectModel(Webhook.name) private webhookModel: Model<Webhook>,
    @InjectModel(PaymentReference.name)
    private paymentReferenceModel: Model<PaymentReference>,
    @Inject(forwardRef(() => InvoiceService))
    private invoiceService: InvoiceService,
    private orderService: OrderService,
    private walletService: WalletService,
    @Inject(forwardRef(() => CreditRepaymentService))
    private creditRepaymentService: CreditRepaymentService,
  ) {}

  config = {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  };

  /**
   * Initialise paystack payment url.
   *
   * @param paymentData
   * @returns
   */
  async initializePayment(
    paymentData: InitializePaystackPaymentInterface,
  ): Promise<any> {
    const url = `${process.env.PAYSTACK_BASE_URL}/transaction/initialize`;
    const response = await this.externalService.post(
      url,
      paymentData,
      this.config,
    );

    return response;
  }

  /**
   * Verify webhook request.
   *
   * @param {*} req
   * @returns
   */
  async verifyWebhook(data: any, req: any) {
    const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(data))
      .digest('hex');
    // Verify request
    if (hash == req.headers['x-paystack-signature']) {
      // Save webhook
      await this.webhookModel.create({ data: JSON.stringify(data) });
      return true;
    }
    return false;
  }

  /**
   * Verify transaction reference from webhook.
   *
   * @param {*} reference
   * @returns Boolean
   */
  async verifyTransaction(reference: string) {
    const url = `${process.env.PAYSTACK_BASE_URL}/transaction/verify/${reference}`;
    const transaction = await this.externalService.get(url, this.config);
    if (transaction) {
      const status = transaction.data.status;
      if (status === 'success') {
        const checkDuplicate = await this.paymentReferenceModel.findOne({
          reference,
        });

        if (checkDuplicate) {
          return false;
        }
        return transaction.data;
      }

      return false;
    }
  }

  /**
   * Process webhook request.
   *
   * @param {*} data
   * @param {*} req
   */
  async processPaystackWebhook(data: any, req: Request) {
    const verifyRequest = await this.verifyWebhook(data, req);

    if (verifyRequest) {
      if (data.event === 'charge.success') {
        const reference = data.data.reference;
        const status = await this.verifyTransaction(reference);
        if (status) {
          if (data.data.metadata.invoiceId) {
            const invoiceId = data.data.metadata.invoiceId;
            return await this.invoiceService.payInvoiceFromWebhook(
              invoiceId,
              reference,
            );
          } else if (data.data.metadata.orderId) {
            const orderId = data.data.metadata.orderId;
            return await this.orderService.updateOrderFromWebhook(
              orderId,
              reference,
            );
          } else if (data.data.metadata.businessId) {
            const businessId = data.data.metadata.businessId;
            return await this.walletService.confirmTransaction(
              data.data.reference,
              businessId,
              data.data.amount / 100,
            );
          } else if (data.data.metadata?.creditAccountId) {
            const creditAccountId = data.data.metadata.creditAccountId;
            return await this.creditRepaymentService.initiateCreditRepaymentWebhook(
              {
                creditAccountId,
                amount: data.data.amount, // credit uses kobo
                paymentReference: reference,
              },
            );
          } else if (data.data.channel === 'dedicated_nuban') {
            const senderDetails = {
              payReference: reference,
              amount: data.data.amount / 100,
              email: data.data.customer.email,
            };

            return await this.walletService.fundWalletFromTransfer(
              senderDetails,
            );
          }
          return {};
        }
      } else if (data.event === 'dedicatedaccount.assign.success') {
        const walletDetails = {
          accountName: data.data.dedicated_account.account_name,
          accountNumber: data.data.dedicated_account.account_number,
          bankName: data.data.dedicated_account.bank.name,
          email: data.data.customer.email,
          bankCode: data.data.dedicated_account.bank.id,
        };
        return await this.walletService.assignWallet(walletDetails);
      }

      return {};
    }

    return {};
  }

  async generateVirtualAccount(accountDetails: any): Promise<any> {
    const url = `${process.env.PAYSTACK_BASE_URL}/transaction/initialize`;
    const response = await this.externalService.post(
      url,
      accountDetails,
      this.config,
    );

    return response;
  }

  async generateNUBAN(accountDetails: INuban): Promise<any> {
    const url = `${process.env.PAYSTACK_BASE_URL}/dedicated_account/assign`;
    const response = await this.externalService.post(
      url,
      accountDetails,
      this.config,
    );

    return response;
  }
}
