import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FeedbackCategory, FeedbackStatus } from '../feedback.enum';

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsEnum(FeedbackCategory)
  category?: FeedbackCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  page?: string;
}

export class UpdateFeedbackStatusDto {
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
}
