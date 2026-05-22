import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RequiredPermission } from '../enum/required-permission';

export class CreateRoleDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description: string;

  @IsArray()
  @IsString({ each: true })
  permissions: RequiredPermission[];

  @IsOptional()
  isActive?: boolean;
}
