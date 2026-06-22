import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsHexColor,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { AdminMessageStatus, AdminMessageType } from '../enum/message.enum';

export class CreateAdminMessageDto {
  @IsEnum(AdminMessageType)
  type: AdminMessageType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  message: string;

  @ValidateIf((dto) => dto.type === AdminMessageType.EMAIL)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject?: string;

  @ValidateIf((dto) => dto.type === AdminMessageType.EMAIL)
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  users?: string[];

  @ValidateIf((dto) => dto.type === AdminMessageType.ALERT)
  @IsDateString()
  startDate?: string;

  @ValidateIf((dto) => dto.type === AdminMessageType.ALERT)
  @IsDateString()
  endDate?: string;

  @ValidateIf((dto) => dto.type === AdminMessageType.ALERT)
  @IsHexColor()
  theme?: string;
}

export class UpdateAdminAlertDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  message: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsHexColor()
  theme: string;
}

export class AdminMessageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(AdminMessageType)
  type?: AdminMessageType;

  @IsOptional()
  @IsEnum(AdminMessageStatus)
  status?: AdminMessageStatus;

  @IsOptional()
  @IsIn(['message', 'type', 'status', 'createdAt'])
  sortBy?: 'message' | 'type' | 'status' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
