import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
export class DeleteCategoryDto {
  @IsOptional()
  newCategoryId: string;

  @IsNotEmpty()
  @IsBoolean()
  deleteAll: boolean;
}
