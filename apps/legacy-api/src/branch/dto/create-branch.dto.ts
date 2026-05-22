import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { LGA } from '../interface/branch.interface';

export class CreateBranchDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name of the branch',
    default: 'Branch 1',
  })
  branchName: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Local Government of the branch',
    default: LGA.OJO,
  })
  @IsEnum(LGA)
  lga: string;

  @ApiProperty({
    description: 'Street of the branch',
    default: 'Fadeyi street lekki',
  })
  @IsNotEmpty()
  streetName: string;
}
