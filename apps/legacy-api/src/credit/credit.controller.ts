import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreditService } from './credit.service';
import {
  CreateApplicationDto,
  CreditLimitIncreaseDto,
  CreditRequestDto,
  createApplicationBodySchema,
} from './dto/credit.dto';
import { Business } from '../business/decorator/business.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { SuperAdminGuard } from '../business/guard/role.guard';
import { QueryParamsDto } from '../analytics/dto/query-param.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { multerOptions } from '../cloudinary/utils/multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRepaymentDto } from './dto/repayment.dto';
import { CreditRepaymentService } from '../credit-repayment/credit-repayment.service';
import { successResponse } from '../utils/responses';

@Controller('credit')
@ApiTags('credit')
@ApiBearerAuth()
export class CreditController {
  constructor(
    private creditService: CreditService,
    private repaymentsService: CreditRepaymentService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async getCreditApplications(
    @Business() business: any,
    @Query() queryParams: QueryParamsDto,
  ) {
    return await this.creditService.getCredits(queryParams, business);
  }

  @Post()
  @UseGuards(AuthGuard, SuperAdminGuard)
  @ApiOperation({
    summary: 'Create a credit application',
    description:
      'Submit an initial credit application for the authenticated business. ' +
      'Requires SuperAdmin role. Accepts optional file uploads for a bank statement and an identity document.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(createApplicationBodySchema)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'bankStatement', maxCount: 1 },
        { name: 'identity', maxCount: 1 },
      ],
      { limits: multerOptions.limits, fileFilter: multerOptions.imageFilter },
    ),
  )
  async createApplication(
    @UploadedFiles()
    files: {
      bankStatment?: Express.Multer.File[];
      identity?: Express.Multer.File[];
    },
    @Body() creditDetails: CreateApplicationDto,
    @Business() business: any,
  ) {
    return await this.creditService.createInitialApplication(
      creditDetails,
      business,
      files,
    );
  }

  @Post('limit-increase')
  @UseGuards(AuthGuard, SuperAdminGuard)
  @UseInterceptors(
    FileInterceptor('bankStatement', {
      limits: multerOptions.limits,
      fileFilter: multerOptions.imageFilter,
    }),
  )
  async requestCreditIncreaseApplication(
    @UploadedFile() file: Express.Multer.File,
    @Body() creditDetails: CreditLimitIncreaseDto,
    @Business() business: any,
  ) {
    return await this.creditService.requestCreditIncreaseApplication(
      creditDetails,
      business,
      file,
    );
  }

  @Post('requests')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async sendRequest(
    @Body() creditDetails: CreditRequestDto,
    @Business() business: any,
  ) {
    return await this.creditService.sendCreditRequest(creditDetails, business);
  }

  @Get('requests')
  @UseGuards(AuthGuard)
  async getCreditRequests(
    @Business() business: any,
    @Query() queryParams: QueryParamsDto,
  ) {
    return await this.creditService.getRequests(business, queryParams);
  }

  @Get('requests/:requestId')
  @UseGuards(AuthGuard)
  async getSingleRequest(
    @Param('requestId') requestId: string,
    @Business() business: any,
  ) {
    const businessId = business.id;
    return await this.creditService.getSingleRequestWithRepayments(
      requestId,
      businessId,
    );
  }

  @Get('repayment-history')
  @UseGuards(AuthGuard)
  async getRepaymentHistory(
    @Business() business: any,
    @Query() queryParams: QueryParamsDto,
  ) {
    return await this.creditService.getRepaymentHistory(business, queryParams);
  }

  @Get('credit-account')
  @UseGuards(AuthGuard)
  async getCreditAccount(@Business() business: any) {
    return await this.creditService.getBusinessCreditAccount(business);
  }

  @Patch('cancel-request/:requestId')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async cancelCreditRequest(
    @Param('requestId') requestId: string,
    @Business() business: any,
  ) {
    return await this.creditService.cancelRequest(requestId, business);
  }

  @Post('payment')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async makePayment(
    @Body() data: CreateRepaymentDto,
    @Business() business: any,
  ) {
    const { data: creditAccount } =
      await this.creditService.getBusinessCreditAccount(business);

    if (!creditAccount) {
      throw new BadRequestException('Credit account not found');
    }

    return await this.repaymentsService.makePayment(
      { ...data, creditAccountId: creditAccount._id.toString() },
      creditAccount,
    );
  }

  @Get('upcoming-payment')
  @UseGuards(AuthGuard)
  async getUpcomingPayment(@Business() business: any) {
    return await this.creditService.getUpcomingPayment(business);
  }

  @Post('dev-confirm-card-repayment')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async devConfirmCardRepayment(
    @Body()
    body: {
      paymentReference?: string;
      amountNaira?: number;
      creditAccountId?: string;
    },
    @Business() business: any,
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    const paymentReference = String(body.paymentReference ?? '').trim();
    const amountNaira = Number(body.amountNaira);
    const creditAccountId = String(body.creditAccountId ?? '').trim();

    if (
      !paymentReference ||
      !creditAccountId ||
      !Number.isFinite(amountNaira) ||
      amountNaira <= 0
    ) {
      throw new BadRequestException(
        'Invalid development repayment confirmation payload',
      );
    }

    const { data: creditAccount } =
      await this.creditService.getBusinessCreditAccount(business);

    if (String(creditAccount._id) !== creditAccountId) {
      throw new BadRequestException('Credit account mismatch');
    }

    await this.repaymentsService.initiateCreditRepaymentWebhook({
      creditAccountId: creditAccount._id.toString(),
      amount: Math.round(amountNaira * 100),
      paymentReference,
    });

    return successResponse('Credit repayment confirmed (development)', null);
  }

  @Get(':creditId')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async getSingleCredit(
    @Param('creditId') orderId: string,
    @Business() business: any,
  ) {
    return await this.creditService.getSingleCredit(orderId, business);
  }
}
