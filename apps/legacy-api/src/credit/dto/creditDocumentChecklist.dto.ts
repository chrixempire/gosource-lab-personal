import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdditionalDocDto {
  @ApiProperty({
    type: String,
    example: 'passport',
    description: 'Unique key or identifier of the document',
  })
  key: string;

  @ApiProperty({
    type: String,
    example: 'https://example.com/passport.pdf',
    description: 'URL pointing to the document',
  })
  url: string;
}

export class InitializeChecklistDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  documents: string[];
}

export class UpdateDocumentStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty()
  verified: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  documentName: string;
}
