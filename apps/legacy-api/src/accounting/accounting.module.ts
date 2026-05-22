import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GeneralLedger,
  GeneralLedgerSchema,
} from './schema/generalLedger.schema';
import {
  TransactionLedger,
  TransactionLedgerSchema,
} from './schema/transactionLedger.schema';
import {
  FundingLedger,
  FundingLedgerSchema,
} from './schema/fundingLedger.schema';
import { CreditLedger, CreditLedgerSchema } from './schema/creditLedger.schema';
import {
  AdjustmentLedger,
  AdjustmentLedgerSchema,
} from './schema/adjustmentLedger.schema';
import {
  UserWalletLedger,
  UserWalletLedgerSchema,
} from './schema/userWalletLedger.schema';
import {
  LedgerAccount,
  LedgerAccountSchema,
} from './schema/accountLedger.schema';
import {
  ExpenditureLedger,
  ExpenditureLedgerSchema,
} from './schema/expenditureLedger.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneralLedger.name, schema: GeneralLedgerSchema },
      { name: TransactionLedger.name, schema: TransactionLedgerSchema },
      { name: FundingLedger.name, schema: FundingLedgerSchema },
      { name: CreditLedger.name, schema: CreditLedgerSchema },
      { name: AdjustmentLedger.name, schema: AdjustmentLedgerSchema },
      { name: UserWalletLedger.name, schema: UserWalletLedgerSchema },
      { name: LedgerAccount.name, schema: LedgerAccountSchema },
      { name: ExpenditureLedger.name, schema: ExpenditureLedgerSchema },
    ]),
  ],
  providers: [AccountingService],
  exports: [AccountingModule, AccountingService],
})
export class AccountingModule {}
