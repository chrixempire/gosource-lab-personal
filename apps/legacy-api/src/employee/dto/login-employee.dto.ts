import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsLowercase, IsNotEmpty } from 'class-validator';
export class LoginEmployeeDto {
  @IsNotEmpty()
  @IsEmail()
  @IsLowercase()
  @ApiProperty({
    description: 'email',
    default: 'moyo@gmail.com',
  })
  readonly email: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Employee password',
    default: 'Essien',
  })
  password: string;
}
