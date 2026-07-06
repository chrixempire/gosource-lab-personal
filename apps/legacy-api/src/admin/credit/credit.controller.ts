import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreditRepaymentAdminService } from './credit-repayment-admin.service';
import { CreditNotesService } from './credit-notes.service';
import { CreditDocumentsService } from './credit-documents.service';
import { AdminAuth } from '../auth/decorator/admin-auth.decorator';
import { QueryParamsDto } from '../../analytics/dto/query-param.dto';
import { Roles } from '../auth/decorator/role.decorator';
import { AdminRoles } from '../auth/enum/admin.enum';
import {
  ApproveApplicationDto,
  ApproveCreditRequestDto,
  RejectApplicationDto,
  UpdateApplicationStatusDto,
} from '../../credit/dto/credit.dto';
import {
  CreateInternalNoteDto,
  GetInternalNotesQueryDto,
} from '../../credit/dto/creditInternalNote.dto';
import {
  GetPaymentHistoryQueryDto,
  GetRepaymentsQueryDto,
  PaymentAdminApprovalDto,
} from '../../credit/dto/repayment.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  InitializeChecklistDto,
  UpdateDocumentStatusDto,
} from '../../credit/dto/creditDocumentChecklist.dto';
import { Admin } from '../auth/decorator/admin.decorator';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreditDocumentChecklist } from '../../credit/schema/creditDocumentChecklist.schema';
import { Credit } from '../../credit/schema/credit.schema';
import { CreditRequest } from '../../credit/schema/creditRequest';
import { CreditInternalNote } from '../../credit/schema/creditInternalNote.schema';
import { RepaymentSchedule } from '../../credit/schema/repaymentSchedule.schema';
import { CreditRepaymentService } from '../../credit-repayment/credit-repayment.service';
import { CreditPaymentReference } from '../../credit/schema/creditPaymentReference.schema';
import { RequiredPermission } from '../role/enum/required-permission';
import { SkipActivityLog } from '../../activity/skip-activity-log.decorator';
import { AdminRolesGuard } from '../auth/guard/adminRole.guard';

@Controller('admin/credit')
@ApiTags('admin/credit')
@ApiBearerAuth()
@AdminAuth()
@Roles(AdminRoles.SUPER_ADMIN)
export class CreditController {
  constructor(
    private readonly creditService: CreditService,
    private readonly repaymentService: CreditRepaymentService,
    private readonly adminRepaymentService: CreditRepaymentAdminService,
    private readonly notesService: CreditNotesService,
    private readonly documentsService: CreditDocumentsService,
  ) {}

  @Get()
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'All credit applications.',
    type: [Credit],
  })
  @ApiOperation({ summary: 'Get credit applications' })
  async getCreditApplications(@Query() queryParams: QueryParamsDto) {
    return await this.creditService.getCredits(queryParams);
  }

  @Get('requests')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'All credit request.',
    type: [CreditRequest],
  })
  @ApiOperation({ summary: 'Get credit requests' })
  async getCreditRequests(@Query() queryParams: QueryParamsDto) {
    return await this.creditService.getCreditRequests(queryParams);
  }

  @Patch('requests/:requestId/reject')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with status change
  @ApiOkResponse({
    description: 'Reject credit request by id.',
    type: CreditRequest,
  })
  @ApiOperation({ summary: 'Reject credit request by id' })
  async rejectCreditRequest(
    @Param('requestId') requestId: string,
    @Body() rejectionDetails: RejectApplicationDto,
    @Admin() admin: any,
  ) {
    return await this.creditService.rejectRequest(
      requestId,
      rejectionDetails,
      admin,
    );
  }

  @Get('repayment-schedules')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'Credit Repayment Schedules',
    type: [RepaymentSchedule],
  })
  @ApiOperation({
    summary: 'Get repayment schedules.',
    description: 'Paginated data is returned',
  })
  async getAllRepaymentSchedules(@Query() queryParams: GetRepaymentsQueryDto) {
    return await this.adminRepaymentService.getAllRepaymentSchedules(
      queryParams,
    );
  }

  @Get('payment-history')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'Credit Payment History',
    type: [CreditPaymentReference],
  })
  @ApiOperation({
    summary: 'Get payment history.',
    description: 'Paginated data is returned',
  })
  async getAllPaymentHistory(@Query() queryParams: GetPaymentHistoryQueryDto) {
    return await this.adminRepaymentService.getAllPaymentHistory(queryParams);
  }

  @Get('requests/stats')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDIT_ANALYTICS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'credit request stats',
    type: CreditRequest,
  })
  @ApiOperation({ summary: 'Get credit request stats' })
  async getCreditRequestStats() {
    return await this.creditService.getCreditRequestStats();
  }

  @Get('requests/:requestId')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'credit request - id.',
    type: CreditRequest,
  })
  @ApiOperation({ summary: 'Get credit request by id' })
  async getCreditRequest(@Param('requestId') requestId: string) {
    return await this.creditService.getCreditRequest(requestId);
  }

  // Repayment Management Endpoints
  @Patch('requests/:requestId/approve')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with approval terms
  @ApiOperation({ summary: 'Update credit request with repayment' })
  async approveCreditRequestWithRepayment(
    @Param('requestId') requestId: string,
    @Body() approvalDetails: ApproveCreditRequestDto,
    @Admin() admin: any,
  ) {
    return await this.creditService.approveCreditRequestWithRepayment(
      approvalDetails,
      requestId,
      admin,
    );
  }

  @Get('requests/:requestId/repayment-schedule')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'Repayment schedule.',
    type: [RepaymentSchedule],
  })
  @ApiOperation({
    summary: 'Get repayment schedules.',
    description: 'Paginated data is returned',
  })
  async getRepaymentSchedule(
    @Param('requestId') requestId: string,
    @Query() queryParams: QueryParamsDto,
  ) {
    return await this.adminRepaymentService.getRepaymentSchedule(
      requestId,
      queryParams,
    );
  }

  @Patch('payments/:id/confirm-transfer')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ description: 'Confirmed repayments of bank transfers' })
  @ApiOperation({ summary: 'Confirm bank transfer' })
  async confirmBankTransfer(
    @Param('id') id: string,
    @Body() data: PaymentAdminApprovalDto,
    @Admin() admin: any,
  ) {
    return await this.repaymentService.approveBankTransferPayment(
      id,
      data,
      admin.id,
    );
  }

  @Patch('payments/:id/reject-transfer')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ description: 'Rejected repayments of bank transfers' })
  @ApiOperation({ summary: 'Reject bank transfer' })
  async rejectBankTransfer(@Param('id') id: string, @Admin() admin: any) {
    return await this.repaymentService.rejectBankTransferPayment(id, admin.id);
  }

  @Get('repayment-schedules/overdue')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOperation({ summary: 'Get overdue repayment' })
  async getOverdueRepaymentSchedules(@Query() queryParams: QueryParamsDto) {
    return await this.adminRepaymentService.getOverdueRepaymentSchedules(
      queryParams,
    );
  }

  @Patch(':creditId/reject')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'Reject credit application.',
    type: Credit,
  })
  @ApiOperation({ summary: 'Reject credit application' })
  @SkipActivityLog() // logged explicitly with status change
  async rejectCredit(
    @Param('creditId') creditId: string,
    @Body() rejectionDetails: RejectApplicationDto,
    @Admin() admin: any,
  ) {
    return await this.creditService.rejectApplication(
      rejectionDetails,
      creditId,
      admin,
    );
  }

  @Patch(':creditId/approve')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'Approve credit application.',
    type: Credit,
  })
  @ApiOperation({ summary: 'Approve credit application' })
  @SkipActivityLog() // logged explicitly with status change
  async approveCredit(
    @Param('creditId') creditId: string,
    @Body() approveDetails: ApproveApplicationDto,
    @Admin() admin: any,
  ) {
    return await this.creditService.approveCredit(
      approveDetails,
      creditId,
      admin,
    );
  }

  @Patch(':creditId/update-status')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @SkipActivityLog() // logged explicitly with status change
  @ApiOkResponse({
    description: 'Update a rejected credit application status to pending.',
    type: Credit,
  })
  @ApiOperation({
    summary: 'Update a rejected credit application status to pending',
  })
  async updateCreditStatusToPending(
    @Param('creditId') creditId: string,
    @Body() data: UpdateApplicationStatusDto,
    @Admin() admin: any,
  ) {
    return await this.creditService.updateCreditStatusToPending(
      creditId,
      data,
      admin,
    );
  }

  @Get(':creditId')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'credit application.',
    type: Credit,
  })
  @ApiOperation({ summary: 'credit application' })
  async getSingleCredit(@Param('creditId') creditId: string) {
    return await this.creditService.getSingleCredit(creditId);
  }

  // Internal Notes endpoints
  @Post(':targetId/notes')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'credit application/request note.',
    type: CreditInternalNote,
  })
  @ApiOperation({ summary: 'Create credit application/request note' })
  async createInternalNote(
    @Param('targetId') targetId: string,
    @Body() noteDetails: CreateInternalNoteDto,
    @Admin() admin: any,
  ) {
    const adminUserId = admin.id;
    return await this.notesService.createInternalNote(
      targetId,
      noteDetails,
      adminUserId,
    );
  }

  @Get(':targetId/notes')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'credit application/request note.',
    type: CreditInternalNote,
  })
  @ApiOperation({ summary: 'Get credit application/request note by id' })
  async getInternalNotes(
    @Param('targetId') targetId: string,
    @Query() queryParams: GetInternalNotesQueryDto & QueryParamsDto,
  ) {
    return await this.notesService.getInternalNotes(targetId, queryParams);
  }

  // Additional docs endpoints
  @Post(':applicationId/additional-docs')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOkResponse({
    description: 'Credit with additional documents',
    type: Credit,
  })
  @ApiOperation({ summary: 'Add additional documents' })
  async addAdditionalApplicationDoc(
    @Param('applicationId') applicationId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Admin() admin: any,
  ) {
    return await this.documentsService.addAdditionalApplicationDoc(
      applicationId,
      files,
      admin,
    );
  }

  @Delete(':applicationId/additional-docs/:docKey')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @ApiOperation({ summary: 'Delete additional documents' })
  async deleteAdditionalApplicationDoc(
    @Param('applicationId') applicationId: string,
    @Param('docKey') docKey: string,
  ) {
    return await this.documentsService.deleteAdditionalDoc(
      applicationId,
      docKey,
    );
  }

  // Application Checklist endpoints
  @Post(':applicationId/initialise-checklist')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({
    description: 'credit application checklist',
    type: CreditDocumentChecklist,
  })
  @ApiOperation({ summary: 'Initialise credit application checklist' })
  async initialiseApplicationCheckist(
    @Param('applicationId') applicationId: string,
    @Body() data: InitializeChecklistDto,
  ) {
    return await this.documentsService.initialiseApplicationCheckist(
      applicationId,
      data.documents,
    );
  }

  @Get(':applicationId/checklist')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.VIEW_CREDITS)
  @UseGuards(AdminRolesGuard)
  @ApiOkResponse({ type: CreditDocumentChecklist })
  async getApplicationChecklist(@Param('applicationId') applicationId: string) {
    return await this.documentsService.getApplicationChecklist(applicationId);
  }

  @Patch(':applicationId/checklist')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  async updateApplicationChecklist(
    @Param('applicationId') applicationId: string,
    @Body() data: UpdateDocumentStatusDto,
    @Admin() admin: any,
  ) {
    return await this.documentsService.updateApplicationChecklist(
      applicationId,
      data,
      admin,
    );
  }

  @Delete(':applicationId/checklist')
  @Roles(AdminRoles.SUPER_ADMIN, RequiredPermission.MANAGE_CREDIT)
  @UseGuards(AdminRolesGuard)
  async deleteApplicationChecklist(
    @Param('applicationId') applicationId: string,
  ) {
    return await this.documentsService.deleteApplicationChecklist(
      applicationId,
    );
  }
}
