import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
  IsPositive,
  Max,
} from 'class-validator';
import { RepaymentFrequency } from '../enum/repayment.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { CreditRequestTypeT } from '../enum/credit.enum';

export class CreateApplicationDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'CAC registration number of the business',
    example: 'RC-123456',
  })
  cacRegistrationNumber: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Tax Identification Number',
    example: '12345678-0001',
  })
  tin: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Bank Verification Number',
    example: '22345678901',
  })
  bvn: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Monthly revenue range of the business',
    example: '1M-5M',
  })
  revenueRange: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Number of years the business has been operating',
    example: '3',
  })
  yearOfOperations: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Type of identity document',
    example: 'National ID',
  })
  identityType: string;
}

export const createApplicationBodySchema = {
  description:
    'Credit application details along with optional supporting documents',
  schema: {
    type: 'object',
    required: ['cacRegistrationNumber'],
    properties: {
      cacRegistrationNumber: {
        type: 'string',
        description: 'CAC registration number of the business',
        example: 'RC-123456',
      },
      tin: {
        type: 'string',
        description: 'Tax Identification Number (optional)',
        example: '12345678-0001',
      },
      bvn: {
        type: 'string',
        description: 'Bank Verification Number (optional)',
        example: '22345678901',
      },
      revenueRange: {
        type: 'string',
        description: 'Monthly revenue range of the business (optional)',
        example: '1M-5M',
      },
      yearOfOperations: {
        type: 'string',
        description:
          'Number of years the business has been operating (optional)',
        example: '3',
      },
      bankStatement: {
        type: 'string',
        format: 'binary',
        description:
          'Bank statement document (PDF, image, or DOCX — max 1 file)',
      },
      identity: {
        type: 'string',
        format: 'binary',
        description:
          "Identity document such as national ID, passport, or driver's license (PDF, image, or DOCX — max 1 file)",
      },
      identityType: {
        type: 'string',
        description: 'Type of identity document (optional)',
        example: 'National ID',
      },
    },
  },
};

export class CreditLimitIncreaseDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Monthly revenue range of the business',
    example: '1M-5M',
  })
  revenueRange: string;
}

export class CreditRequestDto {
  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @ApiProperty()
  requestedAmount: number;

  @IsNotEmpty()
  @IsEnum(CreditRequestTypeT)
  @ApiProperty({ enum: CreditRequestTypeT })
  requestType: CreditRequestTypeT;

  @IsOptional()
  @IsEnum([RepaymentFrequency.WEEKLY, RepaymentFrequency.MONTHLY])
  @ApiProperty()
  requestedRepaymentFrequency: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @ApiProperty()
  requestedRepaymentDuration: number;
}

export class RejectApplicationDto {
  @IsNotEmpty()
  @ApiProperty()
  rejectionReason: string;
}

export class UpdateApplicationStatusDto {
  @IsNotEmpty()
  @ApiProperty()
  reason: string;
}

export class ApproveApplicationDto {
  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(100, { message: 'Approved amount must be at least N100' })
  @ApiProperty()
  approvedAmount: number;
}

export class ApproveCreditDto {
  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(100, { message: 'Approved amount must be at least N100' })
  @ApiProperty()
  approvedAmount: number;

  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @ApiProperty()
  interest: number;

  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(7, { message: 'Duration must be at least 7 days' })
  @ApiProperty()
  duration: number;
}

export class ApproveCreditRequestDto {
  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(100, { message: 'Approved amount must be at least N100' })
  @ApiProperty()
  approvedAmount: number;

  @IsNotEmpty()
  @IsEnum(RepaymentFrequency)
  @ApiProperty()
  repaymentFrequency: RepaymentFrequency;

  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive({ message: 'Repayment duration must be positive' })
  @ApiProperty()
  repaymentDuration: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0, { message: 'Custom frequency days cannot be negative' })
  @ApiPropertyOptional()
  customFrequencyDays?: number;

  @IsNotEmpty()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0, { message: 'Interest rate cannot be negative' })
  @Max(100, { message: 'Interest rate cannot exceed 100%' })
  @ApiPropertyOptional()
  interestRate: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0, { message: 'Grace period cannot be negative' })
  @Max(90, { message: 'Grace period cannot exceed 90 days' })
  @ApiPropertyOptional()
  gracePeriodDays?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0, { message: 'Overdue charge rate cannot be negative' })
  @Max(50, { message: 'Overdue charge rate cannot exceed 50%' })
  @ApiPropertyOptional()
  overdueChargeRate?: number;
}

export class CreditTimelineDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  changedAt: Date;

  @ApiProperty()
  changedBy: mongoose.Schema.Types.ObjectId;

  @ApiProperty()
  note?: string;
}
