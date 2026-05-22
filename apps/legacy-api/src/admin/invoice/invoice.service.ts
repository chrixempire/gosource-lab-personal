import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Invoice, InvoiceDocument } from './schema/invoice.schema';
import { Model } from 'mongoose';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../../business/schema/business.schema';
import { NewInvoiceInterface } from './interface/invoice.interface';
import { Order, OrderDocument } from 'src/order/entities/order.entity';
import { Product } from 'src/product/entities/product.entity';
import { generateRandomCode } from '../../utils/helpers';
import { PaystackService } from '../../paystack/paystack.service';
import { InitializePaystackPaymentInterface } from 'src/paystack/interface/paystack.interface';
import { NewEmailInterface } from '../../notification/email/email.interface';
import { EmailService } from '../../notification/email/email.service';
import { PaymentReference } from '../../paystack/schema/paymentReference.schema';
import { InvoiceStatus } from './enum/invoice.enum';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    @InjectModel(Product.name)
    private productModel: Model<Product>,
    @InjectModel(PaymentReference.name)
    private paymentReferenceModel: Model<PaymentReference>,
    private emailService: EmailService,
    @Inject(forwardRef(() => PaystackService))
    private paystackService: PaystackService,
  ) {}

  /**
   * Get all invoices.
   *
   * @returns
   */
  async getAllInvoices(): Promise<any> {
    const invoices = await this.invoiceModel.find();

    return {
      status: true,
      message: 'Invoices fetched successfully',
      data: invoices,
    };
  }

  /**
   * Get single invoice by ID
   *
   * @param invoiceId
   * @returns
   */
  async getSingleInvoice(invoiceId: string): Promise<any> {
    const invoice: InvoiceDocument =
      await this.invoiceModel.findById(invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return {
      status: true,
      message: 'Invoice fetched succesfully',
      data: invoice,
    };
  }

  /**
   * Get invoices by business Id.
   *
   * @param businessId
   * @returns
   */
  async getInvoicesByBusiness(businessId: string): Promise<any> {
    const business: BusinessCustomerDocument =
      await this.businessModel.findById(businessId);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const invoice: InvoiceDocument[] = await this.invoiceModel.find({
      businessId,
    });

    return {
      status: true,
      message: 'Invoices fetched successfully',
      data: invoice,
    };
  }

  /**
   * Create a new product.
   *
   * @param invoiceData
   * @returns
   */
  async createInvoice(
    invoiceData: NewInvoiceInterface,
    adminId: any,
  ): Promise<any> {
    const order: OrderDocument = await this.orderModel.findById(
      invoiceData.orderId,
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const business: BusinessCustomerDocument =
      await this.businessModel.findById(invoiceData.businessId);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const products = invoiceData.products;

    let totalPrice = 0;

    for (let i = 0; i < products.length; i++) {
      const check = await this.productModel.findById(products[i]);
      if (!check) {
        throw new BadRequestException('Invalid product Id passed');
      } else {
        totalPrice += check.actualPrice;
      }
    }

    const reference = generateRandomCode();

    const newInvoice: InvoiceDocument = await this.invoiceModel.create({
      ...invoiceData,
      reference,
      createdBy: adminId,
    });

    if (newInvoice) {
      const metadata = JSON.stringify({
        invoiceId: newInvoice._id,
      });

      const paymentResponseData: InitializePaystackPaymentInterface = {
        metadata,
        amount: totalPrice * 100,
        reference,
        email: business.email,
      };

      const paymentUrl =
        await this.paystackService.initializePayment(paymentResponseData);

      if (paymentUrl) {
        const invoicePaymentUrl = paymentUrl.data.authorization_url;
        newInvoice.paymentReference = reference;
        newInvoice.paymentUrl = invoicePaymentUrl;
        newInvoice.totalAmount = totalPrice;
        newInvoice.save();

        const emailData: NewEmailInterface = {
          to: business.email,
          subject: `GoSource Invoice for order ${order.reference}`,
          template: 'new-invoice',
          variables: {
            BUSINESS: business.businessName,
            PAYMENT_URL: invoicePaymentUrl,
          },
        };

        this.emailService.sendMail(emailData);

        return {
          status: true,
          message: 'Invoice created successfully',
          data: newInvoice,
        };
      }
    }
  }

  async payInvoiceFromWebhook(
    invoiceId: string,
    paymentReference: string,
  ): Promise<any> {
    const invoice: InvoiceDocument =
      await this.invoiceModel.findById(invoiceId);

    if (!invoice) {
      return;
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.save();
    // Save Reference
    await this.paymentReferenceModel.create({
      reference: paymentReference,
    });

    return;
  }
}
