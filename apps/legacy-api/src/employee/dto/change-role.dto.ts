import { IsEnum, IsNotEmpty } from 'class-validator';
import { EmployeeRole } from '../interface/employee.interface';

export class ChangeEmployeeRoleDto {
  @IsNotEmpty()
  @IsEnum(EmployeeRole)
  role: string;
}
