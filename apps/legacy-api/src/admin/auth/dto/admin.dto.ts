import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AdminAccountStatus } from '../enum/admin.enum';

export class ChangeRoleStatusDto {
  @IsNotEmpty()
  roleId: string;

  @IsNotEmpty()
  @IsEnum(AdminAccountStatus)
  status: string;
}

export class ResendInviteDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  callbackUrl: string;
}
