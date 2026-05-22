import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export const employeeRoles = ['manager', 'employee'] as const;
export type EmployeeRole = (typeof employeeRoles)[number];

export class InviteEmployeeDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(employeeRoles)
  role!: EmployeeRole;

  @IsNotEmpty()
  @IsUUID()
  branchId!: string;

  @IsNotEmpty()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
  })
  callbackUrl!: string;
}

export class SetupEmployeeAccountDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    return value;
  })
  @IsString()
  @MinLength(2)
  position?: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[0-9()\-\s]{7,20}$/)
  phoneNumber!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
  password!: string;
}

export class ResendEmployeeInviteDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(employeeRoles)
  role?: EmployeeRole;
}

export class ListBranchMembersQueryDto {
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
  @MaxLength(200)
  search?: string;
}

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9()\-\s]{7,20}$/)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(employeeRoles)
  role?: EmployeeRole;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
