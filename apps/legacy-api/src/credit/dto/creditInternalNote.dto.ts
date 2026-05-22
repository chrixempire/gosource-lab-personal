import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  NotePriority,
  InternalNoteType,
} from '../enum/creditInternalNote.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInternalNoteDto {
  @IsNotEmpty()
  @IsEnum(InternalNoteType)
  @ApiProperty({ enum: InternalNoteType })
  noteType: InternalNoteType;

  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Note must be at least 10 characters long' })
  @MaxLength(2000, { message: 'Note cannot exceed 2000 characters' })
  @ApiProperty()
  note: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional()
  category?: string;

  @IsOptional()
  @IsEnum(NotePriority)
  @ApiPropertyOptional()
  priority?: NotePriority;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  isPrivate?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional()
  attachments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional()
  tags?: string[];
}

// export class UpdateInternalNoteDto {
//   @IsOptional()
//   @IsString()
//   @MinLength(10, { message: 'Note must be at least 10 characters long' })
//   @MaxLength(2000, { message: 'Note cannot exceed 2000 characters' })
//   @ApiPropertyOptional()
//   note?: string;

//   @IsOptional()
//   @IsString()
//   @MaxLength(100)
//   @ApiPropertyOptional()
//   category?: string;

//   @IsOptional()
//   @IsEnum(NotePriority)
//   @ApiPropertyOptional()
//   priority?: NotePriority;

//   @IsOptional()
//   @IsBoolean()
//   @ApiPropertyOptional()
//   isPrivate?: boolean;

//   @IsOptional()
//   @IsArray()
//   @IsString({ each: true })
//   @ApiPropertyOptional()
//   attachments?: string[];

//   @IsOptional()
//   @IsArray()
//   @IsString({ each: true })
//   @ApiPropertyOptional()
//   tags?: string[];
// }

export class GetInternalNotesQueryDto {
  @IsOptional()
  @IsEnum(InternalNoteType)
  @ApiPropertyOptional({ enum: InternalNoteType })
  noteType?: InternalNoteType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  category?: string;

  @IsOptional()
  @IsEnum(NotePriority)
  @ApiPropertyOptional()
  priority?: NotePriority;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  createdBy?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional()
  tags?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc';
}
