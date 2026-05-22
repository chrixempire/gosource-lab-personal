import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { GeneralLedger } from './schema/generalLedger.schema';
import { ClientSession, Connection, Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { UserWalletLedger } from './schema/userWalletLedger.schema';
import { ExpenditureLedger } from './schema/expenditureLedger.schema';
import {
  TransactionLedger,
  TransactionLedgerDocument,
} from './schema/transactionLedger.schema';
import { CreditLedger } from './schema/creditLedger.schema';
import { FundingLedger } from './schema/fundingLedger.schema';
import { AdjustmentLedger } from './schema/adjustmentLedger.schema';
import {
  LedgerAccount,
  LedgerAccountDocument,
} from './schema/accountLedger.schema';
import { ITransactionRecord } from './interface/accounting.interface';

@Injectable()
export class AccountingService implements OnModuleInit {
  constructor(
    @InjectModel(GeneralLedger.name)
    private generalLedgerModel: Model<GeneralLedger>,
    @InjectModel(AdjustmentLedger.name)
    private adjustmentlLedgerModel: Model<AdjustmentLedger>,
    @InjectModel(FundingLedger.name)
    private fundingLedgerModel: Model<FundingLedger>,
    @InjectModel(CreditLedger.name)
    private creditLedgerModel: Model<CreditLedger>,
    @InjectModel(TransactionLedger.name)
    private transactionLedgerModel: Model<TransactionLedger>,
    @InjectModel(ExpenditureLedger.name)
    private expenditureLedgerModel: Model<ExpenditureLedger>,
    @InjectModel(UserWalletLedger.name)
    private userWalletLedgerModel: Model<UserWalletLedger>,
    @InjectModel(LedgerAccount.name)
    private ledgerAccountModel: Model<LedgerAccount>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * Create ledgers during startup if they don't exist.
   *
   */
  async onModuleInit(): Promise<any> {
    (await this.checkAndCreateLedgers(), await this.checkAndCreateAccounts());
  }

  /**
   * Create ledger function.
   */
  private async checkAndCreateLedgers(): Promise<any> {
    const requiredLedgers = [
      'GL_USER_WALLET',
      'GL_FUNDING',
      'GL_EXPENDITURE',
      'GL_CREDIT',
      'GL_ADJUSTMENT',
      'GL_LOAN',
      'GL_INTEREST',
      'GL_REPAYMENT',
    ];

    for (const accountName of requiredLedgers) {
      const ledgerExists = await this.generalLedgerModel.findOne({
        accountName,
      });

      if (!ledgerExists) {
        await this.generalLedgerModel.create({
          accountName,
        });
      }
    }
  }

  /**
   * Create account function.
   */
  private async checkAndCreateAccounts() {
    const requiredAccounts = [
      { accountName: 'SA_SYSTEM_FUNDING', ledgerName: 'GL_FUNDING' },
      { accountName: 'SA_SYSTEM_EXPENDITURE', ledgerName: 'GL_EXPENDITURE' },
      { accountName: 'SA_SYSTEM_ADJUSTMENT', ledgerName: 'GL_ADJUSTMENT' },
      { accountName: 'SA_SYSTEM_LOAN', ledgerName: 'GL_LOAN' },
      { accountName: 'SA_SYSTEM_INTEREST', ledgerName: 'GL_INTEREST' },
      { accountName: 'SA_SYSTEM_REPAYMENT', ledgerName: 'GL_REPAYMENT' },
    ];

    for (const { accountName, ledgerName } of requiredAccounts) {
      const accountExists = await this.ledgerAccountModel.findOne({
        accountName,
      });

      if (!accountExists) {
        const ledger = await this.generalLedgerModel.findOne({
          accountName: ledgerName,
        });

        if (!ledger) {
          throw new Error(
            `General Ledger ${ledgerName} does not exist. Please ensure General Ledger is initialized first.`,
          );
        }

        await this.ledgerAccountModel.create({
          accountName,
          ledger,
        });
      }
    }
  }

  /**
   * Record transaction.
   *
   * @param transactionDetails
   */
  async recordtransaction(
    transactionDetails: ITransactionRecord,
  ): Promise<any> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      const { debitAccountName, creditAccountName, amount, description } =
        transactionDetails;

      const [debitAccount, creditAccount] = await Promise.all([
        this.ledgerAccountModel
          .findOne({ accountName: debitAccountName })
          .session(session),
        this.ledgerAccountModel
          .findOne({ accountName: creditAccountName })
          .session(session),
      ]);

      if (!debitAccount || !creditAccount) {
        throw new Error(`Accounts involved in the transaction must exist.`);
      }

      debitAccount.balance -= amount;
      creditAccount.balance += amount;

      await Promise.all([
        debitAccount.save({ session }),
        creditAccount.save({ session }),
      ]);

      const transactionData = {
        debitAccount,
        creditAccount,
        amount,
        description,
      };

      const transaction: TransactionLedgerDocument =
        new this.transactionLedgerModel(transactionData);
      await transaction.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException();
    } finally {
      session.endSession();
    }
  }

  /**
   * Create all accounts for user.
   *
   * @param userId
   */
  async createAllUserAccounts(userId: string): Promise<any[]> {
    const accountsToCreate = [
      { accountType: 'WALLET', ledgerName: 'GL_USER_WALLET' },
      { accountType: 'CREDIT', ledgerName: 'GL_CREDIT' },
      { accountType: 'FUNDING', ledgerName: 'GL_FUNDING' },
      { accountType: 'EXPENDITURE', ledgerName: 'GL_EXPENDITURE' },
      { accountType: 'LOAN', ledgerName: 'GL_LOAN' },
      { accountType: 'INTEREST', ledgerName: 'GL_INTEREST' },
    ];

    const allAccounts = [];

    for (const { accountType, ledgerName } of accountsToCreate) {
      const account = await this.createUserAccount(
        userId,
        accountType,
        ledgerName,
      );
      allAccounts.push(account);
    }

    return allAccounts;
  }

  /**
   * Account function.
   *
   * @param userId
   * @param accountType
   * @param ledgerName
   */
  private async createUserAccount(
    userId: string,
    accountType: string,
    ledgerName: string,
  ): Promise<any> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      const ledger = await this.generalLedgerModel.findOne({
        accountName: ledgerName,
      });

      if (!ledger) {
        throw new Error(
          `General Ledger ${ledgerName} does not exist. Please ensure General Ledger is initialized first.`,
        );
      }

      const accountName = `UA_${userId}_${accountType}`;

      const accountExists: LedgerAccountDocument = await this.ledgerAccountModel
        .findOne({
          accountName,
        })
        .session(session);

      if (!accountExists) {
        const data = {
          accountName,
          ledger,
        };

        const account = new this.ledgerAccountModel(data);
        await account.save({ session });
        await session.commitTransaction();
        return account;
      }

      await session.commitTransaction();

      return accountExists;
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException();
    } finally {
      session.endSession();
    }
  }

  /**
   * Fund wallet function.
   *
   * @param userId
   * @param amount
   * @param reference
   */
  async fundWallet(
    userId: string,
    amount: number,
    reference: string,
  ): Promise<void> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // Step 1: Update the User Wallet Account
      const userWalletAccount = await this.ledgerAccountModel
        .findOne({
          accountName: `UA_${userId}_WALLET`,
        })
        .session(session);

      if (!userWalletAccount) {
        throw new Error('User Wallet Account not found.');
      }

      userWalletAccount.balance += amount;
      await userWalletAccount.save({ session });

      // Step 2: Update the User Funding Account
      const userFundingAccount = await this.ledgerAccountModel
        .findOne({
          accountName: `UA_${userId}_FUNDING`,
        })
        .session(session);

      if (!userFundingAccount) {
        throw new Error('User Wallet Account not found.');
      }

      userFundingAccount.balance += amount;
      await userFundingAccount.save({ session });

      // Step 3: Update the General Ledger for User Wallet
      const userWalletLedger = await this.generalLedgerModel
        .findOne({
          accountName: 'GL_USER_WALLET',
        })
        .session(session);

      if (userWalletLedger) {
        userWalletLedger.balance += amount;
        await userWalletLedger.save({ session });
      }

      const fundingLedger = await this.generalLedgerModel
        .findOne({
          accountName: 'GL_FUNDING',
        })
        .session(session);

      if (fundingLedger) {
        fundingLedger.balance += amount;
        await fundingLedger.save({ session });
      }

      // Step 4: Update the System Funding Account
      const systemFundingAccount = await this.ledgerAccountModel
        .findOne({
          accountName: 'SA_SYSTEM_FUNDING',
        })
        .session(session);

      if (systemFundingAccount) {
        systemFundingAccount.balance -= amount;
        await systemFundingAccount.save({ session });
      }

      // Step 5: Record the transaction in the Transaction Ledger
      const transactionLedger = {
        debitAccount: systemFundingAccount._id,
        creditAccount: userWalletAccount._id,
        amount,
        description: `Wallet funding via ${reference}`,
      };

      const transaction = new this.transactionLedgerModel(transactionLedger);
      await transaction.save({ session });

      // Step 6: Record in UserWalletLedger
      await this.userWalletLedgerModel.create(
        [
          {
            account: userWalletAccount._id,
            amount,
            description: `Wallet funded: ${reference}`,
            type: 'credit',
          },
        ],
        { session },
      );

      // Step 7: Record in FundingLedger
      await this.fundingLedgerModel.create(
        [
          {
            fundingAccount: systemFundingAccount._id,
            amount,
            description: `Wallet funding: ${reference}`,
            type: 'debit',
          },
        ],
        { session },
      );

      // Step 7: Record in FundingLedger
      await this.fundingLedgerModel.create(
        [
          {
            fundingAccount: userWalletAccount._id,
            amount,
            description: `Wallet funding: ${reference}`,
            type: 'credit',
          },
        ],
        { session },
      );
      await session.commitTransaction();
      return;
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException();
    } finally {
      session.endSession();
    }
  }

  /**
   * Purchase from wallet function.
   *
   * @param userId
   * @param amount
   * @param description
   */
  async purchaseFromWallet(
    userId: string,
    amount: number,
    description: string,
  ): Promise<void> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // Step 1: Update the User Wallet Account
      const userWalletAccount = await this.ledgerAccountModel
        .findOne({ accountName: `UA_${userId}_WALLET` })
        .session(session);

      if (!userWalletAccount) {
        throw new BadRequestException('User Wallet Account not found.');
      }

      if (userWalletAccount.balance < amount) {
        throw new BadRequestException('Insufficient balance.');
      }

      userWalletAccount.balance -= amount;
      await userWalletAccount.save({ session });

      // Step 2: Update the General Ledger for User Wallet
      const userWalletLedger = await this.generalLedgerModel
        .findOne({ accountName: 'GL_USER_WALLET' })
        .session(session);

      if (userWalletLedger) {
        userWalletLedger.balance -= amount;
        await userWalletLedger.save({ session });
      }

      // Step 3: Update the General Ledger for Expenditure
      const expenditureLedger = await this.generalLedgerModel
        .findOne({ accountName: 'GL_EXPENDITURE' })
        .session(session);

      if (expenditureLedger) {
        expenditureLedger.balance += amount;
        await expenditureLedger.save({ session });
      }

      // Step 4: Update the System Expenditure Account
      const systemExpenditureAccount = await this.ledgerAccountModel.findOne({
        accountName: 'SA_SYSTEM_EXPENDITURE',
      });

      if (systemExpenditureAccount) {
        systemExpenditureAccount.balance += amount;
        await systemExpenditureAccount.save({ session });
      }

      // Step 5: Record the transaction in the Transaction Ledger (Optional)
      const transactionLedger = {
        debitAccount: userWalletAccount,
        creditAccount: systemExpenditureAccount,
        amount,
        description: `Purchase: ${description}`,
      };

      const transaction = new this.transactionLedgerModel(transactionLedger);
      await transaction.save({ session });

      // Step 6: Record in UserWalletLedger
      await this.userWalletLedgerModel.create(
        [
          {
            account: userWalletAccount._id,
            amount: -amount,
            description: `Purchase: ${description}`,
            type: 'debit',
          },
        ],
        { session },
      );

      // Step 7: Record in ExpenditureLedger
      await this.expenditureLedgerModel.create(
        [
          {
            expenditureAccount: systemExpenditureAccount._id,
            amount,
            description: `Purchase: ${description}`,
            type: 'credit',
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return;
    } catch (error: any) {
      await session.abortTransaction();
      throw new HttpException(error.response, error.status);
    } finally {
      session.endSession();
    }
  }

  /**
   * Repay credit from wallet function.
   *
   * @param userId
   * @param amount
   * @param description
   */
  async repayCreditFromWallet(
    userId: string,
    amount: number,
    description: string,
  ): Promise<void> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // Step 1: Update the User Wallet Account
      const userWalletAccount = await this.ledgerAccountModel
        .findOne({ accountName: `UA_${userId}_WALLET` })
        .session(session);

      if (!userWalletAccount) {
        throw new BadRequestException('User Wallet Account not found.');
      }

      if (userWalletAccount.balance < amount) {
        throw new BadRequestException('Insufficient balance.');
      }

      userWalletAccount.balance -= amount;
      await userWalletAccount.save({ session });

      // Step 2: Update the General Ledger for User Wallet
      const userWalletLedger = await this.generalLedgerModel
        .findOne({ accountName: 'GL_USER_WALLET' })
        .session(session);

      if (userWalletLedger) {
        userWalletLedger.balance -= amount;
        await userWalletLedger.save({ session });
      }

      // Step 3: Update the General Ledger for Expenditure
      const expenditureLedger = await this.generalLedgerModel
        .findOne({ accountName: 'GL_EXPENDITURE' })
        .session(session);

      if (expenditureLedger) {
        expenditureLedger.balance += amount;
        await expenditureLedger.save({ session });
      }

      // Step 4: Update the System Expenditure Account
      const systemExpenditureAccount = await this.ledgerAccountModel.findOne({
        accountName: 'SA_SYSTEM_EXPENDITURE',
      });

      if (systemExpenditureAccount) {
        systemExpenditureAccount.balance += amount;
        await systemExpenditureAccount.save({ session });
      }

      // Step 5: Record the transaction in the Transaction Ledger (Optional)
      const transactionLedger = {
        debitAccount: userWalletAccount,
        creditAccount: systemExpenditureAccount,
        amount,
        description,
      };

      const transaction = new this.transactionLedgerModel(transactionLedger);
      await transaction.save({ session });

      // Step 6: Record in UserWalletLedger
      await this.userWalletLedgerModel.create(
        [
          {
            account: userWalletAccount._id,
            amount: -amount,
            description,
            type: 'debit',
          },
        ],
        { session },
      );

      // Step 7: Record in ExpenditureLedger
      await this.expenditureLedgerModel.create(
        [
          {
            expenditureAccount: systemExpenditureAccount._id,
            amount,
            description,
            type: 'credit',
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return;
    } catch (error: any) {
      await session.abortTransaction();
      throw new HttpException(error.response, error.status);
    } finally {
      session.endSession();
    }
  }

  /**
   * Refund to wallet function.
   *
   * @param userId
   * @param amount
   * @param description
   */
  async refundToWallet(
    userId: string,
    amount: number,
    description: string,
  ): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Step 1: Update the User Wallet Account
      const userWalletAccount = await this.ledgerAccountModel.findOneAndUpdate(
        { accountName: `UA_${userId}_WALLET` },
        { $inc: { balance: amount } },
        { new: true, session },
      );

      if (!userWalletAccount) {
        throw new Error('User Wallet Account not found.');
      }

      // Step 2: Update the General Ledger for User Wallet
      const userWalletLedger = await this.generalLedgerModel.findOneAndUpdate(
        { accountName: 'GL_USER_WALLET' },
        { $inc: { balance: amount } },
        { new: true, session },
      );

      if (!userWalletLedger) {
        throw new Error('User Wallet Ledger not found.');
      }

      // Step 3: Update the Expenditure or Credit Ledger
      const expenditureOrCreditLedger =
        await this.generalLedgerModel.findOneAndUpdate(
          { accountName: 'GL_EXPENDITURE' }, // Or 'GL_CREDIT' if applicable
          { $inc: { balance: -amount } },
          { new: true, session },
        );

      if (!expenditureOrCreditLedger) {
        throw new Error('Expenditure or Credit Ledger not found.');
      }

      const systemExpenditureAccount = await this.ledgerAccountModel
        .findOne({ accountName: 'SA_SYSTEM_EXPENDITURE' })
        .session(session);

      if (systemExpenditureAccount) {
        systemExpenditureAccount.balance -= amount;
        await systemExpenditureAccount.save({ session });
      }

      // Step 4: Record the transaction in the Transaction Ledger (Optional)
      await this.transactionLedgerModel.create(
        [
          {
            debitAccount: expenditureOrCreditLedger._id,
            creditAccount: userWalletAccount._id,
            amount,
            description: `Refund: ${description}`,
          },
        ],
        { session },
      );

      // Step 4: Record in UserWalletLedger
      await this.userWalletLedgerModel.create(
        [
          {
            userAccount: userWalletAccount._id,
            amount,
            description: `Refund: ${description}`,
            type: 'refund',
          },
        ],
        { session },
      );

      // Step 5: Record in CreditLedger
      await this.creditLedgerModel.create(
        [
          {
            creditAccount: systemExpenditureAccount._id,
            amount,
            description: `Refund: ${description}`,
            type: 'refund',
          },
        ],
        { session },
      );

      // Commit the transaction
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   *
   * @param userId
   * @param page
   * @param limit
   * @param startDate
   * @param endDate
   * @param type
   * @param minAmount
   * @param maxAmount
   * @returns
   */
  async getWalletTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: Date,
    endDate?: Date,
    type?: 'debit' | 'credit',
    minAmount?: number,
    maxAmount?: number,
  ): Promise<TransactionLedger[]> {
    // Find the user's wallet account ID
    const userWalletAccount = await this.ledgerAccountModel.findOne({
      accountName: `UA_${userId}_WALLET`,
    });

    if (!userWalletAccount) {
      throw new Error('User Wallet Account not found.');
    }

    // Build the query based on the filters provided
    const query: any = {
      $or: [
        { debitAccount: userWalletAccount._id },
        { creditAccount: userWalletAccount._id },
      ],
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.date.$gte = startDate;
      }
      if (endDate) {
        query.createdAt.$lte = endDate;
      }
    }

    if (type) {
      if (type === 'debit') {
        query.debitAccount = userWalletAccount._id;
      } else if (type === 'credit') {
        query.creditAccount = userWalletAccount._id;
      }
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) {
        query.amount.$gte = minAmount;
      }
      if (maxAmount) {
        query.amount.$lte = maxAmount;
      }
    }

    // Calculate the skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch the transactions with pagination and filters applied
    const transactions = await this.transactionLedgerModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return transactions;
  }

  async recordCredit(amount: number, session: ClientSession): Promise<void> {
    await this.updateCreditLedger(amount, session);
  }

  private async updateCreditLedger(amount: number, session: ClientSession) {
    await this.generalLedgerModel.findOneAndUpdate(
      { accountName: 'GL_CREDIT' },
      { $inc: { balance: amount } },
      { session },
    );
  }

  async recordInterest(amount: number, session: ClientSession): Promise<void> {
    await this.updateInterestLedger(amount, session);
  }

  private async updateInterestLedger(amount: number, session: ClientSession) {
    await this.generalLedgerModel.findOneAndUpdate(
      { accountName: 'GL_INTEREST' },
      { $inc: { balance: amount } },
      { session },
    );
  }

  async recordRepayment(amount: number, session: ClientSession): Promise<void> {
    await this.updateRepaymentLedger(amount, session);
  }

  private async updateRepaymentLedger(amount: number, session: ClientSession) {
    await this.generalLedgerModel.findOneAndUpdate(
      { accountName: 'GL_REPAYMENT' },
      { $inc: { balance: amount } },
      { session },
    );
  }
}
