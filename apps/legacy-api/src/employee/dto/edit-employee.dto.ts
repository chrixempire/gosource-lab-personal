import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateEmployeeDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  role: string;

  @IsOptional()
  position: string;

  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @IsOptional()
  branchId: string;
}
