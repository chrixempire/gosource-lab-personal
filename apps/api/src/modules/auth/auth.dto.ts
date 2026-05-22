import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const strongPasswordMessage =
  'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character';

export class CustomerSignupDto {
  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsEmail()
  email!: string;
}

export class CustomerResendOtpDto {
  @IsEmail()
  email!: string;
}

export class CustomerLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(strongPasswordPattern, { message: strongPasswordMessage })
  password!: string;
}

export class CustomerVerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code' })
  otp!: string;
}

export class CustomerSetupAccountDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsString()
  @Matches(strongPasswordPattern, { message: strongPasswordMessage })
  password!: string;

  @IsString()
  @MinLength(7)
  phoneNumber!: string;
}

export class CustomerPasswordResetEmailDto {
  @IsEmail()
  email!: string;
}

export class CustomerVerifyPasswordOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Reset code must be a 6-digit code' })
  token!: string;
}

export class CustomerResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Reset code must be a 6-digit code' })
  token!: string;

  @IsString()
  @Matches(strongPasswordPattern, { message: strongPasswordMessage })
  newPassword!: string;
}

export class CustomerRefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class CustomerLogoutDto {
  @IsString()
  refreshToken!: string;
}
