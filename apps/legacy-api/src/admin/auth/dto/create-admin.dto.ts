import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  email: string;

  @IsOptional()
  callbackUrl: string;

  @IsNotEmpty()
  roleId: string;
}
