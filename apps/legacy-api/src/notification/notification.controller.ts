import {
  Body,
  Controller,
  Patch,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthGuard } from '../auth/auth.guard';
import { BusinessCustomer } from '../business/schema/business.schema';
import { Employee } from '../employee/entities/employee.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('notification')
@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(
    @InjectModel(BusinessCustomer.name)
    private businessCustomerModel: Model<BusinessCustomer>,
    @InjectModel(Employee.name)
    private employeeModel: Model<Employee>,
  ) {}

  @Patch('token')
  @ApiOperation({ summary: 'Update notification token' })
  async updateToken(@Req() req: any, @Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Notification token is required');
    }

    const user = req.user;

    if (user.user_type === 'BUSINESS') {
      await this.businessCustomerModel.findByIdAndUpdate(user.id, {
        $addToSet: { notificationTokens: token },
      });
    } else if (user.role && user.businessId) {
      await this.employeeModel.findByIdAndUpdate(user.id, {
        notificationToken: token,
      });
    } else {
      const isEmployee = await this.employeeModel.exists({ _id: user.id });
      if (isEmployee) {
        await this.employeeModel.findByIdAndUpdate(user.id, {
          notificationToken: token,
        });
      } else {
        await this.businessCustomerModel.findByIdAndUpdate(user.id, {
          $addToSet: { notificationTokens: token },
        });
      }
    }

    return {
      status: true,
      message: 'Notification token updated successfully',
    };
  }
}
