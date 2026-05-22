import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
  IsInt,
} from 'class-validator';
import { RepaymentStatus, PaymentMethod } from '../enum/repayment.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateRepaymentDto {
  @IsOptional()
  @IsEnum(RepaymentStatus)
  @ApiPropertyOptional({ enum: RepaymentStatus })
  status?: RepaymentStatus;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @ApiPropertyOptional()
  paidAmount?: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  paidDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  paymentNote?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @ApiPropertyOptional()
  overdueCharges?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @ApiPropertyOptional()
  lateFees?: number;
}

export class GetRepaymentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  page?: number;

  @IsOptional()
  @IsEnum(RepaymentStatus)
  @ApiPropertyOptional({ enum: RepaymentStatus })
  status?: RepaymentStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  businessId?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  toDate?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  isOverdue?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  @ApiPropertyOptional({ enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  creditRequestId?: string;
}

export class CreateRepaymentDto {
  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1, { message: 'Payment amount must be greater than 0' })
  @ApiProperty()
  paymentAmount: number;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  paymentNote?: string;
}

export class BulkProcessPaymentDto extends CreateRepaymentDto {
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional()
  creditAccountId: string;
}

export class PaymentAdminApprovalDto {
  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1, { message: 'Payment amount must be greater than 0' })
  @ApiProperty()
  amount: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  approvalNote?: string;
}

export class GetPaymentHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty()
  page?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  creditRequestId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  businessId?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional()
  toDate?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  @ApiPropertyOptional({ enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;
}
