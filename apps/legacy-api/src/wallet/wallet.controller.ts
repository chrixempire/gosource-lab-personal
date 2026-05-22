import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../auth/auth.guard';
import { Business } from '../business/decorator/business.decorator';
import { FundWalletDto, NewWalletDto, VerifyBvnDto } from './dto/wallet.dto';
import { SuperAdminGuard } from '../business/guard/role.guard';
import { QueryParamsDto } from '../analytics/dto/query-param.dto';

@UseGuards(AuthGuard, SuperAdminGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post()
  async createWallet(
    @Body() walletDetails: NewWalletDto,
    @Business() business: any,
  ) {
    return await this.walletService.createWallet(walletDetails, business.id);
  }

  @Post('verify-bvn')
  async verifyBvn(@Business() business: any, @Body() bvnDetails: VerifyBvnDto) {
    return await this.walletService.verifyBvn(bvnDetails, business);
  }

  @Get()
  async getWallet(@Business() business: any) {
    return await this.walletService.getWallet(business);
  }

  @Post('fund')
  async fundWallet(
    @Business() business: any,
    @Body() paymentDetails: FundWalletDto,
  ) {
    return await this.walletService.createTransaction(
      business.id,
      paymentDetails,
    );
  }

  @Get('transactions')
  async getWalletTransactions(
    @Business() business: any,
    @Query() queryParams: QueryParamsDto,
  ) {
    return await this.walletService.getTransactions(business.id, queryParams);
  }

  @Post('confirm-transaction')
  async confirmTransaction(@Body() data: any) {
    return await this.walletService.confirmTransaction(
      data.reference,
      data.businessId,
      data.amount,
    );
  }
}
