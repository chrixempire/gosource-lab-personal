import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  branchName!: string;

  @IsString()
  @IsNotEmpty()
  streetName!: string;

  @IsString()
  @IsNotEmpty()
  lga!: string;
}

export class ListBranchesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateBranchDto {
  @IsString()
  @IsNotEmpty()
  branchName!: string;

  @IsString()
  @IsNotEmpty()
  streetName!: string;

  @IsString()
  @IsNotEmpty()
  lga!: string;
}
