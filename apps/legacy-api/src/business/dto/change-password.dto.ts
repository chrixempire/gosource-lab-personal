import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Old Password',
  })
  oldPassword: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'New Password',
  })
  newPassword: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Confirm Password',
  })
  confirmPassword: string;
}
