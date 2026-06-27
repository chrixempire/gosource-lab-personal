import { Module } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';
import { Credit, CreditSchema } from '../../credit/schema/credit.schema';
import {
  CreditInternalNote,
  CreditInternalNoteSchema,
} from '../../credit/schema/creditInternalNote.schema';
import {
  RepaymentSchedule,
  RepaymentScheduleSchema,
} from '../../credit/schema/repaymentSchedule.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CreditRequest,
  CreditRequestSchema,
} from '../../credit/schema/creditRequest';
import { S3Service } from '../../cloudinary/s3.service';
import {
  CreditDocumentChecklist,
  CreditDocumentChecklistSchema,
} from '../../credit/schema/creditDocumentChecklist.schema';
import {
  CreditAccount,
  CreditAccountSchema,
} from '../../credit/schema/creditAccount.schema';
import { CreditRepaymentsModule } from '../../credit-repayment/credit-repayment.module';
import { JobsModule } from '../../jobs/jobs.module';

import { CreditRepaymentAdminService } from './credit-repayment-admin.service';
import { CreditNotesService } from './credit-notes.service';
import { CreditDocumentsService } from './credit-documents.service';
import {
  CreditPaymentReference,
  CreditPaymentReferenceSchema,
} from '../../credit/schema/creditPaymentReference.schema';
import { AccountingModule } from '../../accounting/accounting.module';
import { ActivityModule } from '../../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Credit.name, schema: CreditSchema },
      { name: CreditRequest.name, schema: CreditRequestSchema },
      { name: CreditInternalNote.name, schema: CreditInternalNoteSchema },
      { name: RepaymentSchedule.name, schema: RepaymentScheduleSchema },
      {
        name: CreditDocumentChecklist.name,
        schema: CreditDocumentChecklistSchema,
      },
      { name: CreditAccount.name, schema: CreditAccountSchema },
      {
        name: CreditPaymentReference.name,
        schema: CreditPaymentReferenceSchema,
      },
    ]),
    CreditRepaymentsModule,
    JobsModule,
    AccountingModule,
    ActivityModule,
  ],
  providers: [
    CreditService,
    S3Service,
    CreditRepaymentAdminService,
    CreditNotesService,
    CreditDocumentsService,
  ],
  controllers: [CreditController],
  exports: [CreditService],
})
export class AdminCreditModule {}
