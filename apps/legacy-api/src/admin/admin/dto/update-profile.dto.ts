import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class UpdateProfileSuperAdminDto extends UpdateProfileDto {
  @IsOptional()
  @IsString()
  roleId?: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be atleast 6 characters long' })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  oldPassword: string;
}
