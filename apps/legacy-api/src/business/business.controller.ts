import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { Business } from './decorator/business.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ISendOtp, IVerifyOtp, PhoneNumberDto } from '../auth/dto/auth.dto';
import { SuperAdminGuard } from './guard/role.guard';

@ApiTags('Business')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  @UseGuards(AuthGuard, SuperAdminGuard)
  async getBusiness(@Business() business: any) {
    return await this.businessService.getBusiness(business.id);
  }

  @Patch('/change-password')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async changePassword(
    @Body() data: ChangePasswordDto,
    @Business() business: any,
  ) {
    return await this.businessService.changePassword(data, business.id);
  }

  @Post('send-otp')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async resendOtp(@Body() data: ISendOtp, @Business() business: any) {
    return await this.businessService.sendOtp(data, business);
  }

  @Post('verify-otp')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async verifyOtp(@Body() data: IVerifyOtp, @Business() business: any) {
    return await this.businessService.verifyOtp(data, business);
  }

  @Patch('change-phone-number')
  @UseGuards(AuthGuard)
  async changePhoneNumber(
    @Body() data: PhoneNumberDto,
    @Business() business: any,
  ) {
    return await this.businessService.changePhoneNumber(data, business);
  }

  @Delete('delete-business')
  @UseGuards(AuthGuard, SuperAdminGuard)
  async deleteBusiness(@Business() business: any) {
    return await this.businessService.deleteAccount(business.id);
  }
}
