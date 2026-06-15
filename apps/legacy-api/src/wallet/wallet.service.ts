import {
  BadRequestException,
  ConflictException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Wallet, WalletDocument } from './schema/wallet.schema';
import { ClientSession, Connection, Model } from 'mongoose';
import { INewWallet, IVerifyBvn } from './interface/wallet.interface';
import { Otp } from '../auth/schema/otp.schema';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../business/schema/business.schema';
import {
  encryptText,
  generateAccountNumber,
  generateOtp,
  generateRandomCode,
  generateWalletReference,
} from '../utils/helpers';
import { AccountingService } from '../accounting/accounting.service';
import {
  PaymentTransactionReference,
  PaymentTransactionReferenceDocument,
} from './schema/transactionReferenc.schema';
import { OtpInterface } from '../auth/interface/auth.interface';
import { TransactionType } from '../accounting/enum/accounting.enum';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from './schema/walletTransaction.schema';
import { QueryParamsDto } from '../analytics/dto/query-param.dto';
import { TransactionStatus } from './enum/wallet.enum';
import { TermiiService } from '../termii/termii.service';
import { addMinutes, format } from 'date-fns';
import { IdentitypassService } from '../identitypass/identitypass.service';
import { PaystackService } from '../paystack/paystack.service';
import { INuban } from '../paystack/interface/paystack.interface';
import { EmailService } from '../notification/email/email.service';
import { NewEmailInterface } from '../notification/email/email.interface';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(Otp.name) private otpModel: Model<Otp>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
    @InjectModel(WalletTransaction.name)
    private transactionModel: Model<WalletTransaction>,
    @InjectModel(PaymentTransactionReference.name)
    private paymentReferenceModel: Model<PaymentTransactionReference>,
    private accountingService: AccountingService,
    private identityPassService: IdentitypassService,
    private termiiService: TermiiService,
    @InjectConnection() private readonly connection: Connection,
    @Inject(forwardRef(() => PaystackService))
    private paystackService: PaystackService,
    private emailService: EmailService,
  ) {}

  /**
   * Verify BVN.
   *
   * @param bvnDetails
   * @param business
   * @returns {object}
   */
  async verifyBvn(bvnDetails: IVerifyBvn, business: any): Promise<any> {
    const wallet: WalletDocument = await this.walletModel.findOne({
      customer: business.id,
    });

    if (wallet) {
      throw new ConflictException('You already have an existing wallet');
    }

    let phoneNumber;

    if (process.env.NODE_ENV !== 'production') {
      phoneNumber = '08164120316';
    }

    const code = generateOtp();
    const otpData: OtpInterface = {
      code,
      email: bvnDetails.bvn,
    };

    await this.otpModel.create(otpData);

    return {
      status: true,
      message: 'BVN verified successfully',
      data: {
        phoneNumber,
      },
    };
  }

  /**
   * Create wallet.
   *
   * @param walletDetails
   * @param businessId
   */
  async createWallet(
    walletDetails: INewWallet,
    businessId: string,
  ): Promise<any> {
    // Start database session
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // Check if wallet exist
      const wallet: WalletDocument = await this.walletModel.findOne({
        customer: businessId,
      });

      if (wallet) {
        throw new ConflictException('You already have an existing wallet');
      }

      const business: BusinessCustomerDocument =
        await this.businessModel.findById(businessId);

      let phoneNumber: string;

      // Check if phone number is v1 format
      if (business.phoneNumber) {
        phoneNumber = business.phoneNumber;
      } else {
        throw new BadRequestException('Update your phone number to continue');
      }

      const nubanDetails: INuban = {
        first_name: business.businessName,
        last_name: business.lastName,
        phone: phoneNumber,
        email: business.email,
        country: 'NG',
        preferred_bank: 'wema-bank',
      };

      let nuban = true;

      // Create dedicated nuban in production
      if (process.env.NODE_ENV === 'production') {
        nuban = await this.paystackService.generateNUBAN(nubanDetails);
      }

      if (nuban) {
        const reference = generateWalletReference();
        // Create all user accounts on ledger
        const accounts =
          await this.accountingService.createAllUserAccounts(reference);

        const targetAccountName = `${reference}_WALLET`;
        const account = accounts.find(
          (acc: any) => acc.accountName === `UA_${targetAccountName}`,
        );

        if (accounts) {
          let accountName: string;
          let accountNumber: number;
          let bankName: string;
          let bankCode: string;

          if (process.env.NODE_ENV !== 'production') {
            accountName = business.businessName;
            bankCode = '005';
            bankName = 'GoSource Digital Bank';
            accountNumber = generateAccountNumber();
          }

          accountName = 'Loading...';
          accountNumber = 0o0000000000;
          bankName = 'Loading...';
          bankCode = 'Loading...';

          const walletData = {
            bvn: encryptText('0000000000'),
            reference,
            customer: business._id,
            account: account._id,
            accountName,
            bankCode,
            accountNumber,
            bankName,
          };

          // Create a new wallet for the user
          const newWallet = new this.walletModel(walletData);
          await newWallet.save({ session });

          // Commit session
          await session.commitTransaction();

          return {
            status: true,
            message: 'Wallet created successfully',
            data: newWallet,
          };
        }
      }
    } catch (error: any) {
      await session.abortTransaction();
      throw new HttpException(error.response, error.status);
    } finally {
      session.endSession();
    }
  }

  /**
   * Assign wallet from webhook
   * @param walletDetails
   * @returns void
   */
  async assignWallet(walletDetails: any): Promise<any> {
    // Wait for 10secs
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const { email } = walletDetails;

    // Check if business exist via email
    const business = await this.businessModel.findOne({ email });
    if (!business) {
      return;
    }

    // Check if wallet exist
    const wallet = await this.walletModel.findOne({ customer: business._id });

    if (!wallet) {
      throw new BadRequestException();
    }

    if (wallet.accountName !== 'Loading...') {
      return;
    }

    wallet.accountName = walletDetails.accountName;
    wallet.accountNumber = walletDetails.accountNumber;
    wallet.bankName = walletDetails.bankName;
    wallet.bankCode = walletDetails.bankCode;
    wallet.save();

    return;
  }

  /**
   * Create a funding transaction.
   *
   * @param businessId
   * @param paymentDetails
   * @returns {object}
   */
  async createTransaction(businessId: any, paymentDetails: any): Promise<any> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      const { amount, transactionReference } = paymentDetails;

      const paymentReference: PaymentTransactionReference =
        await this.paymentReferenceModel
          .findOne({
            reference: transactionReference,
          })
          .session(session);

      if (paymentReference) {
        throw new ConflictException('Transaction already processed');
      }

      const newReference = new this.paymentReferenceModel({
        reference: transactionReference,
        channel: 'web',
      });

      await newReference.save({ session });

      const reference = generateRandomCode();

      const business: BusinessCustomerDocument =
        await this.businessModel.findById(businessId);

      const transactionData = {
        reference,
        amount,
        description: 'Wallet funding',
        type: TransactionType.CREDIT,
        business: business._id,
        paymentReference: transactionReference,
      };

      const newTransaction = new this.transactionModel(transactionData);
      await newTransaction.save({ session });
      await session.commitTransaction();

      return {
        status: true,
        message: 'Wallet funded successfully',
        data: newTransaction,
      };
    } catch (error: any) {
      await session.abortTransaction();
      if (error.status) {
        throw new HttpException(error.response, error.status);
      } else {
        throw new InternalServerErrorException(error.response);
      }
    } finally {
      session.endSession();
    }
  }

  async confirmTransaction(
    reference: string,
    businessId: string,
    amount: number,
  ): Promise<void> {
    const confirmDelayMs = process.env.NODE_ENV === 'production' ? 7000 : 300;
    await new Promise((resolve) => setTimeout(resolve, confirmDelayMs));
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // Check if payment was already processed.
      const paymentReference: PaymentTransactionReferenceDocument =
        await this.paymentReferenceModel
          .findOne({ reference, channel: 'web', processed: false })
          .session(session);

      if (!paymentReference) {
        return;
      }

      // Check of transaction exist
      const transaction: WalletTransactionDocument = await this.transactionModel
        .findOne({
          paymentReference: reference,
          status: TransactionStatus.PENDING,
        })
        .session(session);

      if (!transaction) {
        return;
      }

      // Update transaction status
      transaction.status = TransactionStatus.SUCCESSFUL;
      await transaction.save({ session });

      // Check if wallet exist
      const wallet: WalletDocument = await this.walletModel
        .findOne({
          customer: businessId,
        })
        .populate('customer')
        .session(session);

      if (!wallet) {
        return;
      }

      // Update wallet balance
      wallet.balance += amount;
      await wallet.save({ session });

      // Post record to ledger
      await this.accountingService.fundWallet(
        wallet.reference,
        amount,
        transaction.reference,
      );

      paymentReference.processed = true;
      await paymentReference.save({ session });

      await session.commitTransaction();
      // Send email
      const emailData: NewEmailInterface = {
        to: wallet.customer.email,
        subject: `Wallet funding successful`,
        template: 'new-funding',
        variables: {
          TIME: format(new Date(), 'hh:mm a'),
          DATE: format(new Date(), 'MMMM d, yyyy'),
          CHANNEL: 'Web',
          AMOUNT: Intl.NumberFormat().format(amount),
          STATUS: 'Successful',
          REFERENCE: transaction.reference,
          BUSINESS: wallet.customer.businessName,
          SUBJECT: `Your wallet has been funded successfully`,
        },
      };

      this.emailService.sendMail(emailData);

      return;
    } catch (error: any) {
      await session.abortTransaction();
      if (error.status) {
        throw new HttpException(error.response, error.status);
      } else {
        throw new InternalServerErrorException(error.response);
      }
    } finally {
      session.endSession();
    }
  }

  /**
   * Fund wallet from bank transfer.
   *
   * @param fundingDetails
   * @returns {object}
   */
  async fundWalletFromTransfer(fundingDetails: any): Promise<void> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      const { payReference, amount, email } = fundingDetails;
      // Check if payment was already processed.
      const paymentReference: PaymentTransactionReferenceDocument =
        await this.paymentReferenceModel
          .findOne({ payReference })
          .session(session);

      if (paymentReference) {
        return;
      }

      const reference = generateRandomCode();

      const business: BusinessCustomerDocument = await this.businessModel
        .findOne({ email })
        .session(session);

      if (!business) {
        return;
      }

      const transactionData = {
        reference,
        amount,
        description: 'Wallet funding',
        type: TransactionType.CREDIT,
        business: business._id,
        paymentReference: payReference,
        status: TransactionStatus.SUCCESSFUL,
      };

      const newTransaction = new this.transactionModel(transactionData);
      await newTransaction.save({ session });

      // Check if wallet exist
      const wallet: WalletDocument = await this.walletModel
        .findOne({
          customer: business._id,
        })
        .session(session);

      if (!wallet) {
        return;
      }

      // Update wallet balance
      wallet.balance += amount;
      await wallet.save({ session });

      // Post record to ledger
      await this.accountingService.fundWallet(
        wallet.reference,
        amount,
        reference,
      );

      const newReference = new this.paymentReferenceModel({
        reference: payReference,
      });
      await newReference.save({ session });

      await session.commitTransaction();
      // Send email

      const emailData: NewEmailInterface = {
        to: business.email,
        subject: `Wallet funding successful`,
        template: 'new-funding',
        variables: {
          TIME: format(new Date(), 'hh:mm a'),
          DATE: format(new Date(), 'MMMM d, yyyy'),
          CHANNEL: 'Transfer',
          AMOUNT: Intl.NumberFormat().format(amount),
          STATUS: 'Successful',
          REFERENCE: reference,
          BUSINESS: business.businessName,
          SUBJECT: `Your wallet has been funded successfully`,
        },
      };

      this.emailService.sendMail(emailData);

      return;
    } catch (error: any) {
      await session.abortTransaction();
      if (error.status) {
        throw new HttpException(error.response, error.status);
      } else {
        throw new InternalServerErrorException(error.response);
      }
    } finally {
      session.endSession();
    }
  }

  /**
   * Get customer wallet details.
   *
   * @param business
   * @returns {object}
   */
  async getWallet(business: any): Promise<any> {
    const wallet: WalletDocument = await this.walletModel.findOne({
      customer: business.id,
    });

    if (!wallet) {
      throw new NotFoundException('You do not have any active wallet');
    }

    wallet.bvn = undefined;

    return {
      status: true,
      message: 'Wallet fetched successfully',
      data: wallet,
    };
  }

  /**
   * Get wallet transactions.
   *
   * @param businessId
   * @param queryParams
   * @returns {object}
   */
  async getTransactions(
    businessId: string,
    queryParams: QueryParamsDto,
  ): Promise<any> {
    const { limit = 10, page = 1 } = queryParams;
    const filters = { business: businessId };
    const [transactions, totalTransactions] = await Promise.all([
      this.transactionModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.transactionModel.countDocuments(filters),
    ]);

    return {
      status: true,
      message: 'Transactions fetched successfully',
      data: { transactions, totalTransactions, meta: { page, limit } },
    };
  }

  async purchaseFromWallet(
    businessId: string,
    amount: number,
    reference: string,
  ): Promise<any> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      const wallet: WalletDocument = await this.walletModel.findOne({
        customer: businessId,
      });
      if (!wallet) {
        throw new NotFoundException('You do not have any active wallet');
      }

      if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const description = 'Purchase from wallet';

      await this.accountingService.purchaseFromWallet(
        wallet.reference,
        amount,
        description,
      );

      wallet.balance -= amount;
      await wallet.save({ session });

      const transactionData = {
        reference,
        amount,
        description,
        type: TransactionType.DEBIT,
        business: businessId,
        paymentReference: reference,
        status: TransactionStatus.SUCCESSFUL,
      };

      const newTransaction = new this.transactionModel(transactionData);
      await newTransaction.save({ session });
      await session.commitTransaction();
      return;
    } catch (error: any) {
      await session.abortTransaction();
      if (error.status) {
        throw new HttpException(error.response, error.status);
      } else {
        throw new InternalServerErrorException(error.response);
      }
    } finally {
      session.endSession();
    }
  }

  /**
   * Repay credit from wallet function.
   * @param businessId
   * @param amount
   * @param reference
   * @returns
   */
  async repayCreditFromWallet(
    businessId: string,
    amount: number,
    reference: string,
  ): Promise<any> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      const wallet: WalletDocument = await this.walletModel.findOne({
        customer: businessId,
      });
      if (!wallet) {
        throw new NotFoundException('You do not have any active wallet');
      }

      if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const description = 'Credit repayment from wallet';

      await this.accountingService.repayCreditFromWallet(
        wallet.reference,
        amount,
        description,
      );

      wallet.balance -= amount;
      await wallet.save({ session });

      const transactionData = {
        reference,
        amount,
        description,
        type: TransactionType.DEBIT,
        business: businessId,
        paymentReference: reference,
        status: TransactionStatus.SUCCESSFUL,
      };

      const newTransaction = new this.transactionModel(transactionData);
      await newTransaction.save({ session });
      await session.commitTransaction();
      return;
    } catch (error: any) {
      await session.abortTransaction();
      if (error.status) {
        throw new HttpException(error.response, error.status);
      } else {
        throw new InternalServerErrorException(error.response);
      }
    } finally {
      session.endSession();
    }
  }

  /**
   * Send BVN verification request.
   *
   * @param bvnDetails
   * @param userId
   * @returns
   */
  async verifyBvn2(bvnDetails: IVerifyBvn): Promise<any> {
    // Send BVN verification request.
    let bvnRequest: any;

    if (process.env.NODE_ENV !== 'production') {
      bvnRequest = '';
    } else {
      bvnRequest =
        await this.identityPassService.sendBvnVerificationRequest(bvnDetails);
    }

    if (bvnRequest) {
      // Check if phone number linked to the bvn is up to 11 digits
      const phoneNumberLength1: number = bvnRequest.phoneNumber1.length;

      if (
        phoneNumberLength1 !== 11 &&
        phoneNumberLength1 !== 13 &&
        phoneNumberLength1 !== 14
      ) {
        const phoneNumberLength2: number = bvnRequest.phoneNumber2.length;

        if (
          phoneNumberLength2 !== 11 &&
          phoneNumberLength2 !== 13 &&
          phoneNumberLength2 !== 14
        ) {
          throw new BadRequestException('Invalid phone number linked to BVN');
        }

        // Send otp to phone number 2
        const otpFunction = await this.sendOtp(bvnRequest.phoneNumber2);

        if (otpFunction) {
          return {
            status: true,
            message: 'BVN verified successfully',
            data: {
              phoneNumber: bvnRequest.phoneNumber2,
            },
          };
        }
      }

      // Send otp to phone number 1
      const otp = await this.sendOtp(bvnRequest.phoneNumber1);

      if (otp) {
        return {
          status: true,
          message: 'BVN verified successfully',
          data: {
            phoneNumber: bvnRequest.phoneNumber1,
          },
        };
      }
    }
  }

  /**
   * Convert phone number to an array and send otp to phone.
   * @param phone
   * @returns
   */
  async sendOtp(phone: string) {
    // Convert phone number to array and remove the initial 0
    let phoneNumber: string;

    if (phone.length === 11) {
      phoneNumber = '234' + phone.substring(1);
    } else if (phone.length === 14) {
      phoneNumber = phone.substring(1);
    } else {
      phoneNumber = phone;
    }
    // Send OTP to phone number
    const otp = await this.sendPhoneVerificationCode({
      phoneNumber,
    });

    // Hide some parts for the number for security reasons
    const hiddenNumber = '****' + phone.substring(6);

    return { otp, hiddenNumber };
  }

  /**
   * Send phone number verification code.
   *
   * @param phoneNumber
   * @returns {object}
   */
  async sendPhoneVerificationCode(phoneNumber: any): Promise<any> {
    //Check if the number already have a verification code in DB
    const oldCode: any = 0;

    // If a code already exist, delete it before sending a new one.
    if (oldCode) {
      // Delete code from DB before sending a new one
    }

    const newCode: number = Math.floor(10000 + Math.random() * 90000);
    // const details: any = {
    //   code: newCode,
    //   phoneNumber: phoneNumber.phoneNumber,
    // };

    if (process.env.NODE_ENV !== 'production') {
      const newData: any = {
        phoneNumber: phoneNumber.phoneNumber,
        code: newCode,
        expiredAt: addMinutes(new Date(), 10),
        countryCode: 'NG',
      };

      // Store new verification code to DB and set it expire in 5mins.

      return {
        status: true,
        message: 'Verification code sent successfully',
        data: newData,
      };
    } else {
      // Send SMS to queue
      //   const send = await this.smsQueue.add(details);
      let send;

      if (send) {
        const newData: any = {
          phoneNumber: phoneNumber.phoneNumber,
          code: newCode,
          expiredAt: addMinutes(new Date(), 10),
          countryCode: 'NG',
        };

        // Store new verification code to DB and set it expire in 5mins.

        return {
          status: true,
          message: 'Verification code sent successfully',
          data: newData,
        };
      }
    }
  }
}
