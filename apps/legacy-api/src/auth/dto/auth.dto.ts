import {
  IsEnum,
  IsLowercase,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { AccountType } from '../../business/enum/business.enum';

export class IVerifyOtp {
  @IsNotEmpty()
  otp: string;

  @IsNotEmpty()
  @IsLowercase()
  email: string;
}

export class ISendOtp {
  @IsNotEmpty()
  @IsLowercase()
  email: string;
}

export class PhoneNumberDto {
  @IsNotEmpty()
  newPhoneNumber: string;

  @IsOptional()
  firstName: string;

  @IsOptional()
  lastName: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsLowercase()
  email: string;
}

export class NewPasswordDto {
  @IsNotEmpty()
  @IsLowercase()
  email: string;

  @IsNotEmpty()
  newPassword: string;
}

export class NewBusinessDto {
  @IsNotEmpty()
  @ValidateIf((o) => o.accountType === AccountType.BUSINESS)
  businessName: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @ValidateIf((o) => o.accountType === AccountType.INDIVIDUAL)
  lastName: string;

  @ValidateIf((o) => o.accountType === AccountType.INDIVIDUAL)
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  @ValidateIf((o) => o.accountType === AccountType.INDIVIDUAL)
  password: string;

  @IsNotEmpty()
  @ValidateIf((o) => o.accountType === AccountType.INDIVIDUAL)
  phoneNumber: string;

  @IsOptional()
  @IsEnum(AccountType)
  accountType: string;
}
