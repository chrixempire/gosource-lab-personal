import { IsEmail, IsNotEmpty } from 'class-validator';

export class SetAdminPasswordDto {
  @IsNotEmpty()
  password: string;
}

export class InitiatePasswordResetDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class CompletePasswordResetDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  password: string;
}

export class VerifyOTPDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  token: string;
}
