import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}

export class ChangeEmployeeBranchDto {
  @IsNotEmpty()
  branchId: string;
}
