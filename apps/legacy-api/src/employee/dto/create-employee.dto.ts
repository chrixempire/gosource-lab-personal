import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  // IsLowercase,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { EmployeeRole } from '../interface/employee.interface';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Employee first name',
    default: 'Hamzat',
  })
  firstName: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Employee last name',
    default: 'Essien',
  })
  lastName: string;

  @IsOptional()
  role: string;

  @IsOptional()
  position: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Employee Phone no',
    default: '070213283912',
  })
  phoneNumber: string;

  // @IsNotEmpty()
  // @IsEmail()
  // @IsLowercase()
  // @ApiProperty({
  //   description: 'email',
  //   default: 'moyo@gmail.com',
  // })
  // email: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Employee password',
    default: 'Essien',
  })
  password: string;

  // @IsNotEmpty()
  // @ApiProperty({
  //   description: 'Employee position',
  //   default: 'Manager',
  // })
  // businessId: string;

  // @IsNotEmpty()
  // @ApiProperty({
  //   description: 'Employee password',
  //   default: 'Essien',
  // })
  // branchId: string;
}

export class InviteEmployeeDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'email',
    default: 'moyo@gmail.com',
  })
  email: string;

  @IsNotEmpty()
  @IsEnum(EmployeeRole)
  @ApiProperty({
    description: 'Employee role',
    default: EmployeeRole.MANAGER,
  })
  role: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Employee branch',
  })
  branchId: string;

  @IsNotEmpty()
  @ApiProperty({
    description: '',
  })
  callbackUrl: string;
}
