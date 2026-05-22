import { IsNotEmpty } from 'class-validator';

export class CreateAdminRoleDto {
  @IsNotEmpty()
  name: string;
}
